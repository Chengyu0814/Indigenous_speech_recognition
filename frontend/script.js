const form = document.getElementById('uploadForm');
const audioFileInput = document.getElementById('audioFile');
const dialectSelect = document.getElementById('dialectSelect');
const submitButton = document.getElementById('submitButton');
const loadingDiv = document.getElementById('loading');
const resultDiv = document.getElementById('result');
const transcriptionText = document.getElementById('transcriptionText');
const errorDiv = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');
const fileErrorSpan = document.getElementById('fileError');

// 新增錄音相關元素
const recordButton = document.getElementById('recordButton');
const stopButton = document.getElementById('stopButton');
const recordingStatus = document.getElementById('recordingStatus');
const recordingTime = document.getElementById('recordingTime');
const audioPreview = document.getElementById('audioPreview');
const recordedAudio = document.getElementById('recordedAudio');

// --- 後端 API 的 URL ---
// 如果你的後端運行在不同的主機或端口，請修改這裡
const BACKEND_URL = 'http://localhost:5000/transcribe'; // 或者 http://<你的後端IP>:5000/transcribe

// --- 錄音相關變數 ---
let mediaRecorder;
let audioChunks = [];
let recordingStartTime;
let recordingTimer;
let audioBlob;

// --- 檢查瀏覽器是否支援錄音API ---
function checkMicrophoneSupport() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('瀏覽器不支援錄音功能');
        recordButton.disabled = true;
        recordButton.textContent = '瀏覽器不支援錄音';
        // 顯示友好的錯誤訊息
        const recordSection = document.getElementById('recordSection');
        const errorMsg = document.createElement('p');
        errorMsg.className = 'error-message';
        errorMsg.textContent = '您的瀏覽器不支援錄音功能。請使用最新版的Chrome、Firefox或Safari瀏覽器。';
        recordSection.appendChild(errorMsg);
    }
}

// --- 開始錄音 ---
recordButton.addEventListener('click', async () => {
    audioChunks = [];
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            // 停止計時器
            clearInterval(recordingTimer);
            
            // 將錄音片段合併成一個blob
            audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
            
            // 建立URL並顯示音頻控制器
            const audioUrl = URL.createObjectURL(audioBlob);
            recordedAudio.src = audioUrl;
            
            // 顯示音頻預覽
            audioPreview.classList.remove('hidden');
            recordingStatus.classList.add('hidden');
        };
        
        // 開始錄音
        mediaRecorder.start();
        
        // 更新UI
        recordButton.disabled = true;
        stopButton.disabled = false;
        recordingStatus.classList.remove('hidden');
        audioPreview.classList.add('hidden');
        
        // 開始計時
        recordingStartTime = Date.now();
        updateRecordingTime();
        recordingTimer = setInterval(updateRecordingTime, 1000);
        
    } catch (error) {
        console.error('獲取麥克風權限失敗:', error);
        alert('無法訪問麥克風。請確保您已授予麥克風訪問權限，並且沒有其他應用程式正在使用麥克風。');
    }
});

// --- 停止錄音 ---
stopButton.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        
        // 停止所有音軌
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        // 更新UI
        recordButton.disabled = false;
        stopButton.disabled = true;
    }
});

// --- 更新錄音時間 ---
function updateRecordingTime() {
    const elapsedTime = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    recordingTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

form.addEventListener('submit', async (event) => {
    event.preventDefault(); // 阻止表單的默認提交行為

    // --- 清除之前的狀態 ---
    fileErrorSpan.textContent = '';
    resultDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');
    loadingDiv.classList.remove('hidden');
    submitButton.disabled = true; // 禁用按鈕防止重複提交

    // --- 獲取表單數據 ---
    const audioFile = audioFileInput.files[0];
    const selectedDialect = dialectSelect.value;
    
    // --- 準備 FormData ---
    const formData = new FormData();
    formData.append('dialect', selectedDialect); // 'dialect' 必須和後端 app.py 中 request.form 的 key 一致

    // --- 檢查輸入來源: 文件上傳或錄音 ---
    let audioSource = null;
    
    if (audioFile) {
        // 使用上傳的文件
        audioSource = audioFile;
        
        // 基本前端驗證
        if (!audioFile.name.toLowerCase().endsWith('.mp3')) {
            fileErrorSpan.textContent = '僅支援 MP3 格式的檔案。';
            loadingDiv.classList.add('hidden');
            submitButton.disabled = false;
            return;
        }
    } else if (audioBlob) {
        // 使用錄音，添加檔案名稱屬性
        // 創建一個新的 File 物件，從錄音的 Blob 轉換，並添加 .mp3 副檔名
        audioSource = new File([audioBlob], "recorded_audio.mp3", { 
            type: "audio/mpeg", 
            lastModified: new Date().getTime() 
        });
    } else {
        // 沒有音頻源
        fileErrorSpan.textContent = '請選擇一個 MP3 檔案或使用麥克風錄音。';
        loadingDiv.classList.add('hidden');
        submitButton.disabled = false;
        return;
    }
    
    // 添加選擇的音頻源到 FormData
    formData.append('audio_file', audioSource);

    // --- 發送請求到後端 ---
    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            body: formData,
            // 注意：使用 FormData 時，瀏覽器會自動設定 Content-Type 為 multipart/form-data
            // 不要手動設定 Content-Type，否則可能會出錯
        });

        // 檢查 HTTP 狀態碼
        if (!response.ok) {
            // 嘗試解析後端返回的錯誤訊息 (如果有的話)
            let errorData = { message: `HTTP 錯誤: ${response.status} ${response.statusText}` };
            try {
                // 後端可能回傳 JSON 格式的錯誤訊息
                const jsonError = await response.json();
                errorData.message = jsonError.error || errorData.message;
            } catch (e) {
                // 如果後端沒有回傳 JSON 或解析失敗，使用原始的 HTTP 錯誤
                console.warn("Could not parse error response as JSON:", e);
            }
             throw new Error(errorData.message);
        }

        // 解析後端返回的 JSON 結果
        const data = await response.json();

        if (data.transcription) {
            // 成功，顯示結果
            transcriptionText.textContent = data.transcription;
            resultDiv.classList.remove('hidden');
        } else if (data.error) {
            // 後端回報了業務邏輯上的錯誤 (雖然狀態碼是 200 OK，但包含 error 欄位)
             throw new Error(data.error);
        } else {
             // 未知的成功回應格式
             throw new Error('從伺服器收到了無效的回應格式。');
        }

    } catch (error) {
        // 捕獲 fetch 錯誤 (如網路問題) 或上面拋出的錯誤
        console.error('提交失敗:', error);
        errorMessage.textContent = error.message || '發生未知錯誤，請檢查網路連線或稍後再試。';
        errorDiv.classList.remove('hidden');
    } finally {
        // 無論成功或失敗，都要隱藏載入提示，並重新啟用按鈕
        loadingDiv.classList.add('hidden');
        submitButton.disabled = false;
    }
});

// (可選) 在選擇檔案時清除檔案錯誤訊息
audioFileInput.addEventListener('change', () => {
    fileErrorSpan.textContent = '';
});

// 頁面載入時檢查麥克風支援
document.addEventListener('DOMContentLoaded', checkMicrophoneSupport);