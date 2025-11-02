import { Component } from "solid-js";

interface DragDropZoneProps {
  isDragging: boolean;
}

const DragDropZone: Component<DragDropZoneProps> = (props) => {
  return (
    <div
      class={`card transition-all duration-300 card-xl w-xl h-sm select-none ${
        props.isDragging
          ? "bg-primary/5 scale-[1.02]"
          : ""
      }`}
    >
      <div class="card-body items-center justify-center py-20 select-none">
        <div
          class={`relative transition-all duration-300 select-none ${
            props.isDragging ? "scale-110" : "scale-100"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class={`h-20 w-20 select-none transition-colors duration-300 ${
              props.isDragging ? "text-primary" : "text-base-content/40"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <h2
          class={`mt-6 text-xl font-semibold transition-all duration-300 select-none ${
            props.isDragging ? "text-primary" : "text-base-content"
          }`}
        >
          {props.isDragging ? "松开以添加文件" : "拖拽视频文件到此处"}
        </h2>

        <p class={`text-sm mt-2 select-none transition-colors duration-300 ${
          props.isDragging ? "text-primary/80" : "text-base-content/60"
        }`}>
          {props.isDragging ? "释放文件即可开始处理" : "支持 MP4、MKV、AVI 等常见视频格式"}
        </p>

      </div>
    </div>
  );
};

export default DragDropZone;
