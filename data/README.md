# 真实画面与参考位姿

样例选用 TUM RGB-D SLAM Benchmark 的 `freiburg1_xyz`，由 Jürgen Sturm、Nikolas Engelhard、Felix Endres、Wolfram Burgard 和 Daniel Cremers 等发布。作者在 IROS 2012 论文《A Benchmark for the Evaluation of RGB-D SLAM Systems》中说明数据以 CC BY 3.0 发布。该许可适用于本目录中的原始测量值及衍生画面。[数据集](https://cvg.cit.tum.de/data/datasets/rgbd-dataset) · [原论文](https://cvg.cit.tum.de/_media/spezial/bib/sturm12iros.pdf) · [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)

从原始 RGB 时间表中保留具有 20 ms 内参考位姿的图像，然后按索引等间隔抽取 64 帧。抽样跨越 26.572059 秒，实际帧间隔随采集时间略有变化。每张 640 × 480 原始 PNG 缩小为 320 × 240 JPEG。轨迹来自运动捕捉记录，未对位姿插值，样例中的最大匹配时间差为 4.937 ms。

`sequence.json` 的 `t` 是相对首个所选 RGB 帧的秒数。`rgbTimestamp` 和 `poseTimestamp` 分别保留两种传感器的原始 Unix 时间戳。相机中心 `p` 以米为单位，`q` 是原文件顺序的四元数 [qx, qy, qz, qw]，表示相机在世界坐标系中的朝向。`image` 是从项目根目录解析的路径。

## 重新提取

下载[官方归档](https://webshare.cvg.cit.tum.de/g/rgbd/dataset/freiburg1/rgbd_dataset_freiburg1_xyz.tgz)（448,204,271 字节，SHA-256 `a0236d97b8c30cd93b653656d2b6c293ff7c982a4130ef2a1a8beecdb124ef98`）。在装有 Pillow 的 Python 环境中从项目根目录运行下列命令。本次提取使用 Pillow 13.0.0。

```sh
python scripts/extract_tum.py rgbd_dataset_freiburg1_xyz.tgz
```
