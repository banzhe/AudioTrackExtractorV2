import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

/**
 * 音频轨道信息
 */
export interface AudioTrack {
  index: number;
  codec: string;
  channels?: string;
  sample_rate?: string;
  bit_rate?: string;
  language?: string;
  title?: string;
}

/**
 * 获取视频的所有音频轨道信息
 * @param videoPath 视频文件路径
 * @returns 音频轨道列表
 */
export async function getAudioTracks(
  videoPath: string,
): Promise<AudioTrack[]> {
  try {
    const result = await invoke<AudioTrack[]>("get_audio_tracks", {
      videoPath,
    });
    return result;
  } catch (error) {
    throw new Error(`获取音轨信息失败: ${error}`);
  }
}

/**
 * 提取视频音频轨道
 * @param videoPath 视频文件路径
 * @param outputDir 输出目录路径
 * @param transcode 是否转码为 MP3（false 则直接复制音频流）
 * @param trackIndex 指定要提取的音轨索引（可选）
 * @param trackCodec 音轨编码格式（可选，用于直接提取模式）
 * @returns 成功返回输出文件路径，失败抛出错误
 */
export async function extractAudio(
  videoPath: string,
  outputDir: string,
  transcode: boolean = true,
  trackIndex?: number,
  trackCodec?: string,
): Promise<string> {
  try {
    const result = await invoke<string>("extract_audio", {
      videoPath,
      outputDir,
      transcode,
      trackIndex,
      trackCodec,
    });
    return result;
  } catch (error) {
    throw new Error(`音频提取失败: ${error}`);
  }
}

/**
 * 打开文件夹选择对话框
 * @returns 选择的文件夹路径，如果取消则返回 null
 */
export async function selectOutputDirectory(): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    title: "选择音频文件保存位置",
  });

  return selected;
}
