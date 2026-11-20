# 轨迹回放 · Camera Trajectory Replay

[打开交互实验](https://chenyueqi2024.github.io/trajectory-replay/) · [上一站：真实双目匹配](https://chenyueqi2024.github.io/viewpoint-playground/photo/)

在一段 TUM RGB-D 真实拍摄上比较参考轨迹和受控扰动。画面、轨迹投影和三维位置误差曲线共享时间轴，按真实时间间隔播放。所有计算在浏览器内进行。

1. 选择「固定平移」，打开「对齐起点」，比较前后的全段均方根误差。
2. 保持同样的幅度，切换「逐步漂移」，点击曲线或用键盘移动时间滑块，观察偏差从哪个时刻累积。
3. 选择「短时偏移」，定位误差最大的帧，再回放前后的真实画面。

估计轨迹由已知扰动生成，用于控制变量实验。照片来自同一次拍摄。所有指标使用三维位置，二维投影仅供观察。起点对齐只移除首帧平移量，相邻帧位移差采用不等时间间隔的世界坐标向量差。

## 本地运行

在仓库根目录运行 `python -m http.server 8000`，然后打开 http://localhost:8000 。Node 20 或以上可运行 `node --test`。页面无需构建或第三方服务。

## 数据与许可

TUM RGB-D Benchmark，Sturm et al., IROS 2012，CC BY 3.0。包含 64 张缩放后的真实画面和同步参考位姿。[数据来源、署名与提取步骤](data/README.md)。应用代码采用 MIT 许可。
