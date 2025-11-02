import { createSignal, onCleanup, onMount } from "solid-js";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isVideoFile } from "./utils/videoValidation";
import DragDropZone from "./components/DragDropZone";
import VideoList from "./components/VideoList";
import "./App.css";

function App() {
  const [videoFiles, setVideoFiles] = createSignal<string[]>([]);
  const [isDragging, setIsDragging] = createSignal(false);

  // 监听文件拖放事件
  onMount(async () => {
    const appWindow = getCurrentWindow();

    // 在 Tauri 2.0 中，使用 onDragDropEvent 方法监听文件拖放事件
    const unlisten = await appWindow.onDragDropEvent(({ payload }) => {
      if (payload.type === "enter") {
        // 文件进入窗口区域
        setIsDragging(true);
        console.log("文件进入窗口:", payload.paths);
      } else if (payload.type === "over") {
        // 文件在窗口上方悬停（持续触发）
        setIsDragging(true);
      } else if (payload.type === "drop") {
        // 文件被拖放到窗口
        setIsDragging(false);
        const droppedFiles = payload.paths || [];
        const videoFilePaths = droppedFiles.filter(isVideoFile);

        if (videoFilePaths.length > 0) {
          setVideoFiles(videoFilePaths);
          console.log("拖入的视频文件:", videoFilePaths);
        } else {
          console.log("未检测到视频文件");
        }
      } else if (payload.type === "leave") {
        // 文件离开窗口区域
        setIsDragging(false);
      }
    });

    // 清理函数：组件卸载时取消监听
    onCleanup(() => {
      unlisten();
    });
  });

  const handleClearFiles = () => {
    setVideoFiles([]);
  };

  return (
    <div class="min-h-screen bg-base-100">
      {/* 主内容区 */}
      <main class="container mx-auto px-4 py-8">
        {videoFiles().length === 0
          ? (
            <div class="w-full h-full flex items-center justify-center">
              <DragDropZone isDragging={isDragging()} />
            </div>
          )
          : (
            <div>
              <VideoList files={videoFiles()} onClear={handleClearFiles} />
            </div>
          )}
      </main>
    </div>
  );
}

export default App;
