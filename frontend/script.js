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

// --- 後端 API 的 URL ---
// 如果你的後端運行在不同的主機或端口，請修改這裡
const BACKEND_URL = 'http://localhost:5000/transcribe'; // 或者 http://<你的後端IP>:5000/transcribe

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

    // --- 基本前端驗證 ---
    if (!audioFile) {
        fileErrorSpan.textContent = '請選擇一個 MP3 檔案。';
        loadingDiv.classList.add('hidden');
        submitButton.disabled = false;
        return;
    }

    if (!audioFile.name.toLowerCase().endsWith('.mp3')) {
        fileErrorSpan.textContent = '僅支援 MP3 格式的檔案。';
        loadingDiv.classList.add('hidden');
        submitButton.disabled = false;
        return;
    }

    // --- 準備 FormData ---
    // FormData 用於將檔案和其它表單欄位打包發送到後端
    const formData = new FormData();
    formData.append('audio_file', audioFile); // 'audio_file' 必須和後端 app.py 中 request.files 的 key 一致
    formData.append('dialect', selectedDialect); // 'dialect' 必須和後端 app.py 中 request.form 的 key 一致

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