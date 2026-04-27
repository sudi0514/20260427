let video; // 儲存攝影機影像的變數
let circleX;
let circleY;
let circleSize = 100;
let trail = []; // 儲存圓心軌跡的陣列
let greenTrail = []; // 儲存綠色軌跡的陣列
let bubbles = []; // 儲存水泡特效的陣列

function setup() {
  createCanvas(400, 400);
  circleX = width / 2; // 將圓形初始 X 座標設為畫面正中間
  circleY = height / 2; // 將圓形初始 Y 座標設為畫面正中間

  // 啟動攝影機影像擷取
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide(); // 隱藏網頁預設產生的影片元素，我們稍後會統一畫在 Canvas 上
}

function draw() {
  // 將原本的灰色背景替換成攝影機的即時影像
  image(video, 0, 0, width, height);

  let isRedDragging = false; // 紀錄目前是否正在產生紅色軌跡
  let isGreenDragging = false; // 紀錄目前是否正在產生綠色軌跡

  // 假設 'hands' 陣列存放了手部追蹤模型（如 ml5.js）的偵測結果
  if (typeof hands !== 'undefined' && hands.length > 0) {
    for (let i = 0; i < hands.length; i++) {
      let hand = hands[i];
      let keypoints = hand.keypoints;

      if (keypoints && keypoints.length >= 21) {
        // 保留手指上的小圓圈
        push();
        fill(255, 50, 50); // 設定小圓圈為紅色
        noStroke();
        for (let j = 0; j < keypoints.length; j++) {
          circle(keypoints[j].x, keypoints[j].y, 8); // 在每個節點畫上大小為 8 的圓
        }
        pop();

        stroke(0, 255, 0); // 設定線條顏色為綠色
        strokeWeight(2);   // 設定線條粗細

        // 串接 0~4 (包含手腕到大拇指末端)
        for (let j = 0; j < 4; j++) {
          line(keypoints[j].x, keypoints[j].y, keypoints[j + 1].x, keypoints[j + 1].y);
        }
        // 串接 5~8 (食指)
        for (let j = 5; j < 8; j++) {
          line(keypoints[j].x, keypoints[j].y, keypoints[j + 1].x, keypoints[j + 1].y);
        }
        // 串接 9~12 (中指)
        for (let j = 9; j < 12; j++) {
          line(keypoints[j].x, keypoints[j].y, keypoints[j + 1].x, keypoints[j + 1].y);
        }
        // 串接 13~16 (無名指)
        for (let j = 13; j < 16; j++) {
          line(keypoints[j].x, keypoints[j].y, keypoints[j + 1].x, keypoints[j + 1].y);
        }
        // 串接 17~20 (小拇指)
        for (let j = 17; j < 20; j++) {
          line(keypoints[j].x, keypoints[j].y, keypoints[j + 1].x, keypoints[j + 1].y);
        }

        // 在指尖 (4, 8, 12, 16, 20) 產生水泡
        let fingertips = [4, 8, 12, 16, 20];
        for (let idx of fingertips) {
          // 使用亂數控制產生機率 (每幀 15% 機率產生)，讓水泡像是一連串冒出來的
          if (random() < 0.15) {
            bubbles.push({
              x: keypoints[idx].x,
              y: keypoints[idx].y,
              size: random(10, 20), // 水泡大小隨機
              speedY: random(1.5, 3.5), // 往上飄移的速度
              speedX: random(-0.5, 0.5), // 左右輕微搖擺
              life: 255 // 水泡的初始生命值 (影響透明度)
            });
          }
        }

        // 判斷是否為左手，且食指 (編號 8) 與大拇指 (編號 4) 是否同時碰觸到圓
        if (hand.handedness === 'Left') {
          let indexFinger = keypoints[8];
          let thumbFinger = keypoints[4]; // 備註：大拇指指尖節點應為 4
          
          let dIndex = dist(indexFinger.x, indexFinger.y, circleX, circleY);
          let dThumb = dist(thumbFinger.x, thumbFinger.y, circleX, circleY);
          
          // 如果食指與大拇指都在圓的範圍內，代表兩指夾住了圓
          if (dIndex <= circleSize / 2 && dThumb <= circleSize / 2) {
            // 將圓心座標更新為兩根手指的中間點
            circleX = (indexFinger.x + thumbFinger.x) / 2;
            circleY = (indexFinger.y + thumbFinger.y) / 2;
            
            isRedDragging = true; // 標記為正在拖曳紅色軌跡
            trail.push({ x: circleX, y: circleY }); // 記錄當下的圓心座標
          }
        }

        // 判斷左右手的大拇指 (編號 4) 是否碰觸到圓，以產生綠色軌跡
        // 確保不會跟原本左手夾住的紅色軌跡衝突
        if (!isRedDragging) {
          let thumbFinger = keypoints[4];
          let dThumbOnly = dist(thumbFinger.x, thumbFinger.y, circleX, circleY);
          
          if (dThumbOnly <= circleSize / 2) {
            circleX = thumbFinger.x;
            circleY = thumbFinger.y;
            isGreenDragging = true;
            greenTrail.push({ x: circleX, y: circleY });
          }
        }
      }
    }
  }

  // 已經移除清空 trail 的邏輯，讓紅色軌跡可以永久保留在畫面上

  // 當沒有觸發綠色軌跡時，清空綠色軌跡陣列
  if (!isGreenDragging) {
    greenTrail = [];
  }

  // 繪製軌跡的紅色線條
  if (trail.length > 1) {
    noFill();
    stroke(255, 0, 0); // 軌跡顏色為紅色
    strokeWeight(3);
    beginShape();
    for (let pt of trail) {
      vertex(pt.x, pt.y);
    }
    endShape();
  }

  // 繪製軌跡的綠色線條
  if (greenTrail.length > 1) {
    noFill();
    stroke(0, 255, 0); // 軌跡顏色為綠色
    strokeWeight(5); // 軌跡線條大小為 5px
    beginShape();
    for (let pt of greenTrail) {
      vertex(pt.x, pt.y);
    }
    endShape();
  }

  // 繪製跟隨移動的圓形
  fill(255, 100, 100, 150); // 設定圓形的顏色為半透明 (加上第 4 個 Alpha 參數)
  stroke(0, 150); // 圓形邊框也設為半透明
  strokeWeight(2);
  circle(circleX, circleY, circleSize);

  // 在整個畫布的中間加上一串文字 (移至圓形繪製之後，確保文字疊在最上層)
  push();
  textAlign(CENTER, CENTER);
  textSize(36);
  fill(100, 100, 150, 150); // 保持文字原本的顏色與半透明度
  text("412730060蘇娣", width / 2, height / 2);
  pop();

  // 更新與繪製水泡特效
  for (let i = bubbles.length - 1; i >= 0; i--) {
    let b = bubbles[i];
    b.y -= b.speedY; // 水泡往上飄升
    b.x += b.speedX; // 稍微左右飄動
    b.life -= 3; // 生命值減少，水泡會逐漸變透明

    // 當生命值小於等於 0 或飄出畫面上方時，水泡破掉並從陣列移除
    if (b.life <= 0 || b.y < 0) {
      bubbles.splice(i, 1);
    } else {
      push();
      stroke(255, b.life); // 白色邊緣 (隨生命值變透明)
      fill(173, 216, 230, b.life * 0.5); // 淺藍色水滴質感 (隨生命值變透明)
      circle(b.x, b.y, b.size);
      pop();
    }
  }
}
