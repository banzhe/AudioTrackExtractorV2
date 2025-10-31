import { Component } from "solid-js";

interface DragDropZoneProps {
  isDragging: boolean;
}

const DragDropZone: Component<DragDropZoneProps> = (props) => {
  return (
    <div
      class={`card bg-base-200 border-2 border-dashed transition-all duration-300 select-none ${
        props.isDragging
          ? "border-primary bg-primary/10 ring ring-primary animate-pulse"
          : "border-base-300"
      }`}
    >
      <div class="card-body items-center justify-center py-16 select-none">
        <div
          class={`transition-transform duration-300 select-none ${
            props.isDragging ? "scale-110" : "scale-100"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-16 w-16 text-primary select-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <h2
          class={`card-title mt-4 text-base-content transition-all duration-300 select-none ${
            props.isDragging ? "text-primary" : ""
          }`}
        >
          {props.isDragging ? "松开以添加文件" : "拖拽视频文件到此处"}
        </h2>
        <p class="text-sm text-base-content/60 mt-2 select-none">
          {props.isDragging ? "释放文件即可开始处理" : "支持常见的视频格式"}
        </p>
      </div>
    </div>
  );
};

export default DragDropZone;
