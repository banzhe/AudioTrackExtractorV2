import { Component, createSignal, For, onMount, createEffect } from "solid-js";
import {
  extractAudio,
  selectOutputDirectory,
  getAudioTracks,
  type AudioTrack,
} from "../utils/audioExtraction";

interface VideoListProps {
  files: string[];
  onClear?: () => void;
}

interface VideoWithTracks {
  path: string;
  tracks: AudioTrack[];
  selectedTracks: Set<number>;
  isExpanded: boolean;
}

const VideoList: Component<VideoListProps> = (props) => {
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [processingStatus, setProcessingStatus] = createSignal("");
  const [shouldTranscode, setShouldTranscode] = createSignal(true);
  const [videosWithTracks, setVideosWithTracks] = createSignal<VideoWithTracks[]>([]);

  const getFileName = (filePath: string) => {
    // 从完整路径中提取文件名
    const parts = filePath.split(/[\\/]/);
    return parts[parts.length - 1];
  };

  const getFileExtension = (filePath: string) => {
    const fileName = getFileName(filePath);
    const lastDot = fileName.lastIndexOf(".");
    return lastDot > 0 ? fileName.substring(lastDot + 1).toUpperCase() : "";
  };

  // 当视频列表变化时，加载所有视频的音轨信息
  createEffect(async () => {
    const files = props.files;
    if (files.length === 0) {
      setVideosWithTracks([]);
      return;
    }

    const videosData: VideoWithTracks[] = [];
    for (const filePath of files) {
      try {
        const tracks = await getAudioTracks(filePath);
        videosData.push({
          path: filePath,
          tracks,
          selectedTracks: new Set(tracks.length > 0 ? [0] : []), // 默认选中第一个音轨
          isExpanded: false,
        });
      } catch (error) {
        console.error(`获取音轨信息失败: ${filePath}`, error);
        videosData.push({
          path: filePath,
          tracks: [],
          selectedTracks: new Set(),
          isExpanded: false,
        });
      }
    }
    setVideosWithTracks(videosData);
  });

  const toggleVideoExpanded = (index: number) => {
    setVideosWithTracks((prev) =>
      prev.map((v, i) =>
        i === index ? { ...v, isExpanded: !v.isExpanded } : v
      )
    );
  };

  const toggleTrackSelection = (videoIndex: number, trackIndex: number) => {
    setVideosWithTracks((prev) =>
      prev.map((v, i) => {
        if (i === videoIndex) {
          const newSelected = new Set(v.selectedTracks);
          if (newSelected.has(trackIndex)) {
            newSelected.delete(trackIndex);
          } else {
            newSelected.add(trackIndex);
          }
          return { ...v, selectedTracks: newSelected };
        }
        return v;
      })
    );
  };

  const handleExtractAudio = async () => {
    try {
      setIsProcessing(true);
      setProcessingStatus("正在选择保存位置...");

      // 打开文件夹选择对话框
      const outputDir = await selectOutputDirectory();

      if (!outputDir) {
        setProcessingStatus("已取消操作");
        setIsProcessing(false);
        return;
      }

      const videos = videosWithTracks();
      let successCount = 0;
      let failCount = 0;
      let totalTasks = 0;

      // 计算总任务数
      for (const video of videos) {
        totalTasks += video.selectedTracks.size;
      }

      if (totalTasks === 0) {
        setProcessingStatus("请至少选择一个音轨");
        setTimeout(() => {
          setProcessingStatus("");
          setIsProcessing(false);
        }, 2000);
        return;
      }

      let currentTask = 0;

      // 遍历所有视频文件并提取选中的音轨
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        const fileName = getFileName(video.path);

        for (const trackIndex of video.selectedTracks) {
          currentTask++;
          const track = video.tracks[trackIndex];

          try {
            const trackLabel = track.title || track.language || `Track ${trackIndex}`;
            setProcessingStatus(
              `正在处理 (${currentTask}/${totalTasks}): ${fileName} - ${trackLabel}`,
            );

            await extractAudio(
              video.path,
              outputDir,
              shouldTranscode(),
              trackIndex,
              track.codec,
            );
            successCount++;
          } catch (error) {
            console.error(`处理失败: ${fileName} - Track ${trackIndex}`, error);
            failCount++;
          }
        }
      }

      // 显示处理结果
      setProcessingStatus(
        `处理完成！成功: ${successCount}，失败: ${failCount}`,
      );

      // 3秒后清空状态
      setTimeout(() => {
        setProcessingStatus("");
        setIsProcessing(false);
      }, 3000);
    } catch (error) {
      console.error("音频提取过程出错:", error);
      setProcessingStatus(`错误: ${error}`);
      setIsProcessing(false);
    }
  };

  return (
    <div class="w-full max-w-5xl mx-auto px-4">
      <div class="card bg-base-100 ">
        <div class="card-body">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-semibold flex items-center gap-3">
              <div class="p-2 bg-primary/5 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span class="text-primary">
                视频文件列表
              </span>
            </h2>
            <div class="badge badge-outline badge-lg gap-2 px-4 py-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              {props.files.length} 个文件
            </div>
          </div>

          <div class="divider"></div>

          <ul class="space-y-3">
            <For each={videosWithTracks()}>
              {(video, index) => (
                <li class="">
                  <div class="card bg-base-200 ">
                    <div class="card-body p-5">
                      {/* 视频信息行 */}
                      <div class="flex items-center gap-4">
                        <div class="flex-shrink-0">
                          <div class="avatar placeholder">
                            <div class="bg-primary text-primary-content rounded-lg w-14 h-14">
                              <span class="text-sm font-semibold">
                                {getFileExtension(video.path)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div class="flex-grow min-w-0">
                          <div class="flex items-center gap-2">
                            <p class="font-semibold text-base text-base-content truncate">
                              {getFileName(video.path)}
                            </p>
                          </div>
                          <p class="text-xs text-base-content/50 truncate mt-1 font-mono">
                            {video.path}
                          </p>
                        </div>
                        <div class="flex items-center gap-2 flex-shrink-0">
                          <div class="badge badge-outline gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                            {video.tracks.length} 音轨
                          </div>
                          <div class="badge badge-outline gap-1">
                            <span>#{index() + 1}</span>
                          </div>
                          <button
                            class="btn btn-sm btn-ghost btn-circle"
                            onClick={() => toggleVideoExpanded(index())}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              class={`h-4 w-4 transition-transform duration-300 ${video.isExpanded ? "rotate-180" : ""}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* 音轨列表 */}
                      {video.isExpanded && video.tracks.length > 0 && (
                        <div class="mt-4 space-y-2 animate-fade-in">
                          <div class="divider divider-start text-xs text-base-content/50">音轨详情</div>
                          <For each={video.tracks}>
                            {(track) => (
                              <div class={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 border ${
                                video.selectedTracks.has(track.index)
                                  ? "bg-primary/5 border-primary/30"
                                  : "bg-base-100 border-base-300 hover:border-primary/20"
                              }`}>
                                <input
                                  type="checkbox"
                                  class="checkbox checkbox-primary checkbox-sm"
                                  checked={video.selectedTracks.has(track.index)}
                                  onChange={() =>
                                    toggleTrackSelection(index(), track.index)}
                                  disabled={isProcessing()}
                                />
                                <div class="flex-grow">
                                  <div class="flex items-center gap-2 mb-1">
                                    <div class="badge badge-outline badge-sm font-mono">
                                      #{track.index + 1}
                                    </div>
                                    {track.title && (
                                      <span class="font-medium text-sm">
                                        {track.title}
                                      </span>
                                    )}
                                  </div>
                                  <div class="flex flex-wrap gap-1.5">
                                    <div class="badge badge-outline badge-xs gap-1">
                                      {track.codec.toUpperCase()}
                                    </div>
                                    {track.channels && (
                                      <div class="badge badge-outline badge-xs gap-1">
                                        {track.channels} 声道
                                      </div>
                                    )}
                                    {track.sample_rate && (
                                      <div class="badge badge-outline badge-xs gap-1">
                                        {track.sample_rate} Hz
                                      </div>
                                    )}
                                    {track.language && (
                                      <div class="badge badge-outline badge-xs gap-1">
                                        {track.language}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </For>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              )}
            </For>
          </ul>

          <div class="divider"></div>

          {/* 转码选项 */}
          <div class="card bg-base-200 border border-base-300 mb-4">
            <div class="card-body p-4">
              <label class="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  class="checkbox checkbox-primary"
                  checked={shouldTranscode()}
                  onChange={(e) => setShouldTranscode(e.currentTarget.checked)}
                  disabled={isProcessing()}
                />
                <span class="label-text">
                  <div class="flex flex-col">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-sm">转码为 MP3</span>
                      <div class={`badge badge-xs ${shouldTranscode() ? "badge-success" : "badge-outline"}`}>
                        {shouldTranscode() ? "已启用" : "已禁用"}
                      </div>
                    </div>
                    <span class="text-xs text-base-content/60 mt-1">
                      {shouldTranscode()
                        ? "将音频转换为 MP3 格式（兼容性好，文件较大）"
                        : "直接提取原始音频流（速度快，保持原始格式和质量）"}
                    </span>
                  </div>
                </span>
              </label>
            </div>
          </div>

          {/* 处理状态提示 */}
          {processingStatus() && (
            <div class="alert alert-info mb-4">
              <div class="flex items-center gap-3">
                {isProcessing() && (
                  <span class="loading loading-spinner loading-sm"></span>
                )}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  class="stroke-current shrink-0 w-5 h-5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  >
                  </path>
                </svg>
                <span class="text-sm">{processingStatus()}</span>
              </div>
            </div>
          )}

          <div class="card-actions justify-end gap-2 mt-2">
            <button
              class="btn btn-primary gap-2"
              onClick={handleExtractAudio}
              disabled={isProcessing()}
            >
              {isProcessing()
                ? (
                  <>
                    <span class="loading loading-spinner loading-sm"></span>
                    <span>处理中...</span>
                  </>
                )
                : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width={2}
                        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                      />
                    </svg>
                    <span>开始提取音频</span>
                  </>
                )}
            </button>

            {props.onClear && (
              <button
                class="btn btn-outline btn-error gap-2"
                onClick={props.onClear}
                disabled={isProcessing()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span>清空列表</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoList;

