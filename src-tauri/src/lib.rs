use std::process::Command;
use std::path::Path;
use serde::{Deserialize, Serialize};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// 音频轨道信息
#[derive(Debug, Serialize, Deserialize)]
pub struct AudioTrack {
    /// 轨道索引
    index: usize,
    /// 编码格式
    codec: String,
    /// 声道数
    channels: Option<String>,
    /// 采样率
    sample_rate: Option<String>,
    /// 比特率
    bit_rate: Option<String>,
    /// 语言
    language: Option<String>,
    /// 标题
    title: Option<String>,
}

/// 章节信息
#[derive(Debug, Serialize, Deserialize)]
pub struct Chapter {
    /// 章节索引
    index: usize,
    /// 开始时间（秒）
    start_time: f64,
    /// 结束时间（秒）
    end_time: f64,
    /// 章节标题
    title: Option<String>,
}

/// 使用 ffprobe 检测视频的音频编码格式
fn detect_audio_codec(video_path: &str) -> Result<String, String> {
    let output = Command::new("ffprobe")
        .arg("-v")
        .arg("error")
        .arg("-select_streams")
        .arg("a:0")  // 选择第一个音频流
        .arg("-show_entries")
        .arg("stream=codec_name")  // 只显示编码名称
        .arg("-of")
        .arg("default=noprint_wrappers=1:nokey=1")  // 简洁输出
        .arg(video_path)
        .output()
        .map_err(|e| format!("无法执行 ffprobe: {}", e))?;

    if output.status.success() {
        let codec = String::from_utf8_lossy(&output.stdout)
            .trim()
            .to_string();
        Ok(codec)
    } else {
        Err("无法检测音频编码格式".to_string())
    }
}

/// 根据音频编码决定文件扩展名
fn get_extension_for_codec(codec: &str) -> &str {
    match codec {
        "aac" => "m4a",
        "mp3" => "mp3",
        "opus" => "opus",
        "vorbis" => "ogg",
        "flac" => "flac",
        "alac" => "m4a",
        "ac3" => "ac3",
        "eac3" => "eac3",
        "dts" => "dts",
        "wmav2" | "wmapro" => "wma",
        "pcm_s16le" | "pcm_s24le" | "pcm_s32le" => "wav",
        _ => "mka",  // 未知格式使用 MKA 作为通用容器
    }
}

/// 获取视频的章节信息
#[tauri::command]
fn get_chapters(video_path: String) -> Result<Vec<Chapter>, String> {
    // 验证视频文件是否存在
    if !Path::new(&video_path).exists() {
        return Err(format!("视频文件不存在: {}", video_path));
    }

    // 使用 ffprobe 获取章节信息
    let output = Command::new("ffprobe")
        .arg("-v")
        .arg("error")
        .arg("-show_entries")
        .arg("chapter=id,start_time,end_time:chapter_tags=title")
        .arg("-of")
        .arg("json")
        .arg(&video_path)
        .output()
        .map_err(|e| format!("无法执行 ffprobe: {}", e))?;

    if !output.status.success() {
        return Err("无法获取章节信息".to_string());
    }

    // 解析 JSON 输出
    let json_str = String::from_utf8_lossy(&output.stdout);
    let json: serde_json::Value = serde_json::from_str(&json_str)
        .map_err(|e| format!("解析 JSON 失败: {}", e))?;

    let mut chapters = Vec::new();

    if let Some(chapter_array) = json["chapters"].as_array() {
        for (idx, chapter) in chapter_array.iter().enumerate() {
            let start_time = chapter["start_time"]
                .as_str()
                .and_then(|s| s.parse::<f64>().ok())
                .unwrap_or(0.0);
            let end_time = chapter["end_time"]
                .as_str()
                .and_then(|s| s.parse::<f64>().ok())
                .unwrap_or(0.0);
            let title = chapter["tags"]["title"].as_str().map(|t| t.to_string());

            chapters.push(Chapter {
                index: idx,
                start_time,
                end_time,
                title,
            });
        }
    }

    Ok(chapters)
}

/// 获取视频的所有音频轨道信息
#[tauri::command]
fn get_audio_tracks(video_path: String) -> Result<Vec<AudioTrack>, String> {
    // 验证视频文件是否存在
    if !Path::new(&video_path).exists() {
        return Err(format!("视频文件不存在: {}", video_path));
    }

    // 使用 ffprobe 获取所有音频流信息
    let output = Command::new("ffprobe")
        .arg("-v")
        .arg("error")
        .arg("-select_streams")
        .arg("a")  // 选择所有音频流
        .arg("-show_entries")
        .arg("stream=index,codec_name,channels,sample_rate,bit_rate:stream_tags=language,title")
        .arg("-of")
        .arg("json")  // JSON 输出
        .arg(&video_path)
        .output()
        .map_err(|e| format!("无法执行 ffprobe: {}", e))?;

    if !output.status.success() {
        return Err("无法获取音频轨道信息".to_string());
    }

    // 解析 JSON 输出
    let json_str = String::from_utf8_lossy(&output.stdout);
    let json: serde_json::Value = serde_json::from_str(&json_str)
        .map_err(|e| format!("解析 JSON 失败: {}", e))?;

    let mut tracks = Vec::new();

    if let Some(streams) = json["streams"].as_array() {
        for (idx, stream) in streams.iter().enumerate() {
            let codec = stream["codec_name"].as_str().unwrap_or("unknown").to_string();
            let channels = stream["channels"].as_i64().map(|c| c.to_string());
            let sample_rate = stream["sample_rate"].as_str().map(|s| s.to_string());
            let bit_rate = stream["bit_rate"].as_str().map(|b| b.to_string());
            let language = stream["tags"]["language"].as_str().map(|l| l.to_string());
            let title = stream["tags"]["title"].as_str().map(|t| t.to_string());

            tracks.push(AudioTrack {
                index: idx,
                codec,
                channels,
                sample_rate,
                bit_rate,
                language,
                title,
            });
        }
    }

    Ok(tracks)
}

#[tauri::command]
fn extract_audio(
    video_path: String,
    output_dir: String,
    transcode: bool,
    track_index: Option<usize>,
    track_codec: Option<String>,
    split_by_chapters: bool,
) -> Result<String, String> {
    // 验证视频文件是否存在
    if !Path::new(&video_path).exists() {
        return Err(format!("视频文件不存在: {}", video_path));
    }

    // 验证输出目录是否存在
    if !Path::new(&output_dir).exists() {
        return Err(format!("输出目录不存在: {}", output_dir));
    }

    // 从视频路径提取文件名（不含扩展名）
    let video_file_name = Path::new(&video_path)
        .file_stem()
        .and_then(|name| name.to_str())
        .ok_or_else(|| "无法解析视频文件名".to_string())?;

    // 如果需要按章节切割
    if split_by_chapters {
        let chapters = get_chapters(video_path.clone())?;

        if chapters.is_empty() {
            return Err("视频不包含章节信息".to_string());
        }

        // 确定文件扩展名
        let extension = if transcode {
            "mp3".to_string()
        } else {
            let codec = if let Some(c) = &track_codec {
                c.clone()
            } else {
                detect_audio_codec(&video_path)?
            };
            get_extension_for_codec(&codec).to_string()
        };

        // 对每个章节进行提取
        for chapter in &chapters {
            let default_title = format!("Chapter{}", chapter.index + 1);
            let chapter_title = chapter.title.as_deref().unwrap_or(&default_title);

            let track_suffix = if let Some(idx) = track_index {
                format!("_track{}", idx)
            } else {
                String::new()
            };

            let output_file = Path::new(&output_dir).join(format!(
                "{}{}_{:02}_{}.{}",
                video_file_name,
                track_suffix,
                chapter.index + 1,
                chapter_title,
                extension
            ));

            let output_path = output_file
                .to_str()
                .ok_or_else(|| "无法构建输出路径".to_string())?;

            // 构建 ffmpeg 命令
            let mut command = Command::new("ffmpeg");
            command
                .arg("-i")
                .arg(&video_path)
                .arg("-ss")
                .arg(chapter.start_time.to_string())
                .arg("-to")
                .arg(chapter.end_time.to_string());

            // 如果指定了轨道索引，使用 -map 选择特定音轨
            if let Some(idx) = track_index {
                command
                    .arg("-map")
                    .arg(format!("0:a:{}", idx));
            } else {
                command.arg("-vn");
            }

            if transcode {
                command
                    .arg("-acodec")
                    .arg("libmp3lame")
                    .arg("-q:a")
                    .arg("2");
            } else {
                command
                    .arg("-acodec")
                    .arg("copy");
            }

            command
                .arg("-y")
                .arg(output_path);

            let output = command.output()
                .map_err(|e| format!("无法执行 FFmpeg: {}", e))?;

            if !output.status.success() {
                let error_msg = String::from_utf8_lossy(&output.stderr);
                return Err(format!("FFmpeg 执行失败（章节 {}）: {}", chapter.index + 1, error_msg));
            }
        }

        Ok(format!("成功提取 {} 个章节", chapters.len()))
    } else {
        // 原有的完整提取逻辑
        let output_file = if transcode {
            let suffix = if let Some(idx) = track_index {
                format!("_track{}.mp3", idx)
            } else {
                ".mp3".to_string()
            };
            Path::new(&output_dir).join(format!("{}{}", video_file_name, suffix))
        } else {
            let codec = if let Some(c) = track_codec {
                c
            } else {
                detect_audio_codec(&video_path)?
            };
            let extension = get_extension_for_codec(&codec);

            let suffix = if let Some(idx) = track_index {
                format!("_track{}.{}", idx, extension)
            } else {
                format!(".{}", extension)
            };
            Path::new(&output_dir).join(format!("{}{}", video_file_name, suffix))
        };

        let output_path = output_file
            .to_str()
            .ok_or_else(|| "无法构建输出路径".to_string())?;

        let mut command = Command::new("ffmpeg");
        command
            .arg("-i")
            .arg(&video_path);

        if let Some(idx) = track_index {
            command
                .arg("-map")
                .arg(format!("0:a:{}", idx));
        } else {
            command.arg("-vn");
        }

        if transcode {
            command
                .arg("-acodec")
                .arg("libmp3lame")
                .arg("-q:a")
                .arg("2");
        } else {
            command
                .arg("-acodec")
                .arg("copy");
        }

        command
            .arg("-y")
            .arg(output_path);

        let output = command.output();

        match output {
            Ok(result) => {
                if result.status.success() {
                    Ok(output_path.to_string())
                } else {
                    let error_msg = String::from_utf8_lossy(&result.stderr);
                    Err(format!("FFmpeg 执行失败: {}", error_msg))
                }
            }
            Err(e) => {
                Err(format!("无法执行 FFmpeg，请确保已安装 FFmpeg: {}", e))
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![greet, get_audio_tracks, get_chapters, extract_audio])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
