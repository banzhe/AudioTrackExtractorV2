import { Component } from "solid-js";

interface VideoListProps {
  files: string[];
  onClear?: () => void;
}

const VideoList: Component<VideoListProps> = (props) => {
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

  return (
    <div class="w-full max-w-4xl mx-auto px-4">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="flex justify-between items-center mb-4">
            <h2 class="card-title text-2xl">
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
              视频文件列表
            </h2>
            <div class="badge badge-primary badge-lg">
              {props.files.length} 个文件
            </div>
          </div>

          <div class="divider"></div>

          <ul class="space-y-2">
            {props.files.map((file, index) => (
              <li>
                <div class="card bg-base-200 hover:bg-base-300 transition-colors duration-200">
                  <div class="card-body p-4">
                    <div class="flex items-center gap-4">
                      <div class="flex-shrink-0">
                        <div class="avatar placeholder">
                          <div class="bg-primary text-primary-content rounded-lg w-12">
                            <span class="text-lg font-bold">
                              {getFileExtension(file)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div class="flex-grow min-w-0">
                        <div class="flex items-center gap-2">
                          <p class="font-medium text-base-content truncate">
                            {getFileName(file)}
                          </p>
                        </div>
                        <p class="text-sm text-base-content/60 truncate mt-1">
                          {file}
                        </p>
                      </div>
                      <div class="flex-shrink-0">
                        <div class="badge badge-success badge-outline">
                          #{index + 1}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {props.onClear && (
            <>
              <div class="divider"></div>
              <div class="card-actions justify-end">
                <button
                  class="btn btn-outline btn-error"
                  onClick={props.onClear}
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
                  清空列表
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoList;

