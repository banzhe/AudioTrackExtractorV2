// 视频文件扩展名列表
export const videoExtensions = [
  ".mp4",
  ".avi",
  ".mov",
  ".mkv",
  ".flv",
  ".webm",
  ".wmv",
  ".mpg",
  ".mpeg",
  ".m4v",
  ".3gp",
  ".ogv",
  ".ts",
  ".m2ts",
  ".vob",
  ".asf",
];

/**
 * 检查文件是否为视频文件
 * @param filePath 文件路径
 * @returns 如果是视频文件返回 true，否则返回 false
 */
export function isVideoFile(filePath: string): boolean {
  const lowerPath = filePath.toLowerCase();
  return videoExtensions.some((ext) => lowerPath.endsWith(ext));
}

/**
 * 验证多个文件路径，过滤出视频文件
 * @param filePaths 文件路径数组
 * @returns 视频文件路径数组
 */
export function validateVideoFiles(filePaths: string[]): string[] {
  return filePaths.filter(isVideoFile);
}

