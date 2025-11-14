const imgs = [
  "assets/0.png",
  "assets/1.png",
  "assets/2.png",
  "assets/3.png",
  "assets/4.png",
  "assets/5.png",
  "assets/6.png"
];

let index = 0;
const imgEl = document.getElementById("stack-img");
const audio = new Audio("assets/button-push.m4a");

let textLines = [];
let currentLineIndex = 0;
let textContainer = document.getElementById("text-container");

async function loadTextFile() {
  try {
    const response = await fetch("assets/1.txt");
    const text = await response.text();
    textLines = text.split("\n").filter(line => line.trim() !== "");
    currentLineIndex = 0;
  } catch (error) {
    console.error("无法加载文本文件:", error);
    textLines = [];
  }
}

function showTextLine() {
  if (textLines.length === 0) {
    loadTextFile();
    return;
  }


  if (currentLineIndex >= textLines.length) {
    currentLineIndex = 0;
  }

  const existingLines = textContainer.querySelectorAll(".text-line");

  if (existingLines.length >= 2) {
    existingLines[0].remove();
  }

  const remainingLine = textContainer.querySelector(".text-line");
  if (remainingLine) {
    remainingLine.style.transform = "translateY(-3px)";
  }


  const lineElement = document.createElement("div");
  lineElement.className = "text-line";
  lineElement.textContent = textLines[currentLineIndex];
  lineElement.style.transform = "translateY(0px)";
  
  // 添加到容器
  textContainer.appendChild(lineElement);
  
  currentLineIndex++;
}

// 初始化加载文本
loadTextFile();

showImage(index);

imgEl.addEventListener("click", () => {
  // 重置音量并播放（短音效使用快速淡入）
  audio.volume = 0;
  audio.play();
  fadeInAudio(audio, 200);
  index = (index + 1) % imgs.length;
  showImage(index);
  showTextLine();
});

function showImage(i) {
  imgEl.classList.remove("visible");
  setTimeout(() => {
    imgEl.src = imgs[i];
    imgEl.classList.add("visible");
  }, 180);
}

// 音频控制功能
const leftAudio = new Audio("assets/left.m4a");
const rightAudio = new Audio("assets/right.m4a");
const topAudio = new Audio("assets/top.m4a");
const bottomAudio = new Audio("assets/bottom.mp3");

// 设置音频循环
leftAudio.loop = true;
rightAudio.loop = true;
topAudio.loop = true;
bottomAudio.loop = true;

// 存储每个音频的淡入淡出定时器
const audioFadeTimers = {};

// 音频淡入淡出函数
function fadeInAudio(audio, duration = 500) {
  // 清除之前的淡入淡出定时器
  if (audioFadeTimers[audio.src]) {
    clearInterval(audioFadeTimers[audio.src]);
  }
  
  audio.volume = 0;
  audio.play().catch(err => console.error("音频播放失败:", err));
  
  const interval = 10; // 更新间隔（毫秒）
  const steps = duration / interval;
  const volumeStep = 1 / steps;
  
  const fadeInterval = setInterval(() => {
    if (audio.volume < 1) {
      audio.volume = Math.min(1, audio.volume + volumeStep);
    } else {
      clearInterval(fadeInterval);
      audio.volume = 1;
      delete audioFadeTimers[audio.src];
    }
  }, interval);
  
  audioFadeTimers[audio.src] = fadeInterval;
}

function fadeOutAudio(audio, duration = 500, callback) {
  // 清除之前的淡入淡出定时器
  if (audioFadeTimers[audio.src]) {
    clearInterval(audioFadeTimers[audio.src]);
  }
  
  // 如果音频已经暂停，直接执行回调
  if (audio.paused) {
    audio.currentTime = 0;
    audio.volume = 1; // 重置音量以便下次播放
    if (callback) callback();
    return;
  }
  
  const interval = 10; // 更新间隔（毫秒）
  const steps = duration / interval;
  const volumeStep = 1 / steps;
  let currentVolume = audio.volume; // 从当前音量开始淡出
  
  const fadeInterval = setInterval(() => {
    if (currentVolume > 0) {
      currentVolume = Math.max(0, currentVolume - volumeStep);
      audio.volume = currentVolume;
    } else {
      clearInterval(fadeInterval);
      // 立即停止音频（iOS 上需要立即停止）
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1; // 重置音量以便下次播放
      delete audioFadeTimers[audio.src];
      if (callback) callback();
    }
  }, interval);
  
  audioFadeTimers[audio.src] = fadeInterval;
}

// 跟踪播放状态
const audioStates = {
  left: false,
  right: false,
  top: false,
  bottom: false
};

// 音频对象映射
const audioMap = {
  left: leftAudio,
  right: rightAudio,
  top: topAudio,
  bottom: bottomAudio
};

// 空心圆元素映射
const circleMap = {
  left: document.getElementById("left-circle"),
  right: document.getElementById("right-circle"),
  top: document.getElementById("top-circle"),
  bottom: document.getElementById("bottom-circle")
};

// 切换音频播放状态
function toggleAudio(direction) {
  const audio = audioMap[direction];
  const circle = circleMap[direction];
  
  // 检查音频的实际播放状态，而不仅仅依赖 audioStates
  // 在 iOS 上，音频状态可能和 audioStates 不同步
  const isActuallyPlaying = !audio.paused && audio.currentTime > 0 && !audio.ended;
  const isPlaying = audioStates[direction] || isActuallyPlaying;
  
  if (isPlaying) {
    // 立即更新状态，避免重复点击
    audioStates[direction] = false;
    circle.classList.remove("active");
    
    // 停止音频（iOS 上需要立即停止）
    fadeOutAudio(audio, 500, () => {
      // 确保音频完全停止
      audio.pause();
      audio.currentTime = 0;
      audioStates[direction] = false;
      circle.classList.remove("active");
    });
  } else {
    // 确保音频从开始播放
    audio.currentTime = 0;
    fadeInAudio(audio, 500);
    audioStates[direction] = true;
    circle.classList.add("active");
  }
}

// 空心圆点击事件 - 绑定到整个控制容器，确保手机端也能正常点击
// 使用标志位避免 touchstart 和 click 事件重复触发
function addCircleControlListeners(controlId, direction) {
  const control = document.getElementById(controlId);
  let touchHandled = false;
  let touchTimeout = null;
  
  // 处理触摸事件（移动端）
  function handleTouch(e) {
    // 立即触发切换，不等待
    toggleAudio(direction);
    
    // 设置标志，防止后续的 click 事件触发
    touchHandled = true;
    e.preventDefault(); // 阻止后续的 click 事件
    e.stopPropagation();
    
    // 清除之前的定时器
    if (touchTimeout) {
      clearTimeout(touchTimeout);
    }
    
    // 300ms 后重置标志，允许 click 事件（如果 touchstart 未触发）
    touchTimeout = setTimeout(() => {
      touchHandled = false;
    }, 300);
  }
  
  // 处理点击事件（桌面端，或移动端未触发 touchstart 的情况）
  function handleClick(e) {
    // 如果已经处理了触摸事件，则忽略点击事件（避免重复触发）
    if (touchHandled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // 桌面端或移动端未触发 touchstart 的情况，正常处理点击
    e.stopPropagation();
    toggleAudio(direction);
  }
  
  // 同时监听 click 和 touchstart 事件，确保手机端和桌面端都能正常工作
  control.addEventListener("touchstart", handleTouch, { passive: false });
  control.addEventListener("click", handleClick);
}

addCircleControlListeners("left-control", "left");
addCircleControlListeners("right-control", "right");
addCircleControlListeners("top-control", "top");
addCircleControlListeners("bottom-control", "bottom");

// 视频播放功能
const videoContainer = document.getElementById("video-container");
const videoPlayer = document.getElementById("video-player");

// 点击视频外部区域或视频结束时隐藏视频
videoPlayer.addEventListener("ended", () => {
  videoContainer.style.display = "none";
});

videoContainer.addEventListener("click", (e) => {
  if (e.target === videoContainer) {
    videoPlayer.pause();
    videoContainer.style.display = "none";
  }
});

// Logo 点击显示 info.txt
const logoContainer = document.querySelector(".logo-container");
const infoContainer = document.getElementById("info-container");
const infoContent = document.getElementById("info-content");

async function loadAndShowInfo() {
  try {
    const response = await fetch("info.txt");
    const text = await response.text();
    infoContent.textContent = text;
    infoContainer.style.display = "block";
  } catch (error) {
    console.error("无法加载 info.txt:", error);
    infoContent.textContent = "无法加载文件";
    infoContainer.style.display = "block";
  }
}

logoContainer.addEventListener("click", () => {
  if (infoContainer.style.display === "none") {
    loadAndShowInfo();
  } else {
    infoContainer.style.display = "none";
  }
});

// 点击 info 容器外部关闭
infoContainer.addEventListener("click", (e) => {
  if (e.target === infoContainer) {
    infoContainer.style.display = "none";
  }
});
