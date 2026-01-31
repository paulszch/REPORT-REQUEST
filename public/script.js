const btn = document.getElementById('send')
const fileInput = document.getElementById('fileInput')
const preview = document.getElementById('preview')
const statusDiv = document.getElementById('status')
const fileLabel = document.getElementById('fileLabel')
const form = document.getElementById('formPage')

const alertOverlay = document.getElementById('alertOverlay')
const alertIcon = document.getElementById('alertIcon')
const alertTitle = document.getElementById('alertTitle')
const alertMessage = document.getElementById('alertMessage')
const alertButtons = document.getElementById('alertButtons')

function showAlert(options) {
  const {type = 'info', title = 'INFO', message = '', icon = '', confirmText = 'OK', cancelText = 'CANCEL', onConfirm = () => {}, onCancel = () => {}} = options
  const icons = {info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌', confirm: '❓'}
  alertIcon.textContent = icon || icons[type] || icons.info
  alertTitle.textContent = title.toUpperCase()
  alertMessage.textContent = message.toUpperCase()
  alertButtons.innerHTML = ''
  if (type === 'confirm') {
    const cancelBtn = document.createElement('button')
    cancelBtn.className = 'alert-btn'
    cancelBtn.textContent = cancelText
    cancelBtn.onclick = () => {hideAlert(); onCancel(); playBeep(400, 50)}
    const confirmBtn = document.createElement('button')
    confirmBtn.className = 'alert-btn primary'
    confirmBtn.textContent = confirmText
    confirmBtn.onclick = () => {hideAlert(); onConfirm(); playBeep(800, 50)}
    alertButtons.appendChild(cancelBtn)
    alertButtons.appendChild(confirmBtn)
  } else {
    const okBtn = document.createElement('button')
    okBtn.className = `alert-btn ${type === 'error' ? 'danger' : 'primary'}`
    okBtn.textContent = confirmText
    okBtn.onclick = () => {hideAlert(); onConfirm(); playBeep(600, 50)}
    alertButtons.appendChild(okBtn)
  }
  alertOverlay.classList.add('active')
  if (type === 'success') {playBeep(800, 100)} else if (type === 'error') {playBeep(200, 200)} else {playBeep(600, 100)}
}

function hideAlert() {
  alertOverlay.classList.remove('active')
}

alertOverlay.addEventListener('click', e => {if (e.target === alertOverlay) hideAlert()})

const sidebar = document.getElementById('sidebar')
const sidebarToggle = document.getElementById('sidebarToggle')
const sidebarClose = document.getElementById('sidebarClose')
const overlay = document.getElementById('overlay')
const navItems = document.querySelectorAll('.nav-item')
const pages = document.querySelectorAll('.page-content')

function toggleSidebar() {
  sidebar.classList.toggle('active')
  overlay.classList.toggle('active')
  playBeep(600, 50)
}

sidebarToggle.addEventListener('click', toggleSidebar)
sidebarClose.addEventListener('click', toggleSidebar)
overlay.addEventListener('click', toggleSidebar)

navItems.forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault()
    const targetPage = item.dataset.page
    navItems.forEach(nav => nav.classList.remove('active'))
    item.classList.add('active')
    pages.forEach(page => page.classList.remove('active'))
    document.getElementById(targetPage + 'Page').classList.add('active')
    if (window.innerWidth < 768) toggleSidebar()
    if (targetPage === 'history') checkHistoryAuth()
    playBeep(700, 50)
  })
})

function checkHistoryAuth() {
  document.getElementById('passwordModal').style.display = 'block'
  document.getElementById('filterSection').style.display = 'none'
  document.getElementById('historyContainer').style.display = 'none'
  document.getElementById('logoutBtn').style.display = 'none'
  document.getElementById('historyPassword').focus()
}

document.getElementById('submitPassword')?.addEventListener('click', async () => {
  const password = document.getElementById('historyPassword').value.trim()
  const errorEl = document.getElementById('passwordError')
  if (!password) {
    errorEl.textContent = 'PASSWORD REQUIRED!'
    return
  }
  errorEl.textContent = ''
  const btn = document.getElementById('submitPassword')
  btn.disabled = true
  btn.innerHTML = '<span class="blink">▸</span> CHECKING... <span class="blink">◂</span>'
  try {
    const res = await fetch('/api/unlock', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({password})
    })
    const data = await res.json()
    if (data.success) {
      errorEl.textContent = '✓ ACCESS GRANTED!'
      errorEl.style.color = '#86efac'
      document.getElementById('passwordModal').style.display = 'none'
      document.getElementById('filterSection').style.display = 'block'
      document.getElementById('historyContainer').style.display = 'block'
      document.getElementById('logoutBtn').style.display = 'block'
      await loadHistory()
      setTimeout(() => {
        btn.disabled = false
        btn.innerHTML = '<span class="blink">▸</span> UNLOCK <span class="blink">◂</span>'
      }, 300)
    } else {
      errorEl.textContent = '❌ WRONG PASSWORD!'
      btn.disabled = false
      btn.innerHTML = '<span class="blink">▸</span> UNLOCK <span class="blink">◂</span>'
    }
  } catch (err) {
    errorEl.textContent = '❌ CONNECTION ERROR'
    btn.disabled = false
    btn.innerHTML = '<span class="blink">▸</span> UNLOCK <span class="blink">◂</span>'
  }
})

async function loadHistory(status = '') {
  const container = document.getElementById('historyContainer')
  container.innerHTML = '<div class="loading-text">LOADING HISTORY...</div>'
  try {
    let url = '/api/history'
    if (status) url += `?status=${status}`
    const res = await fetch(url)
    if (res.status === 401) {
      document.getElementById('passwordModal').style.display = 'block'
      container.style.display = 'none'
      return
    }
    if (!res.ok) throw new Error('Failed')
    const data = await res.json()
    if (data.reports?.length > 0) {
      container.innerHTML = data.reports.map(report => {
        const statusColors = {'baru': '#a5b4fc', 'diproses': '#fbbf24', 'selesai': '#86efac'}
        const statusColor = statusColors[report.status] || '#60a5fa'
        return `
          <div class="history-item">
            <div class="history-item-header">
              <span class="history-type">${(report.type || 'UNKNOWN').toUpperCase()}</span>
              <span class="history-date">${report.createdAt ? new Date(report.createdAt).toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : 'N/A'}</span>
            </div>
            <div class="history-body">
              <div style="margin-bottom:6px">
                <span style="background:${statusColor}22;border:1px solid ${statusColor};color:${statusColor};padding:2px 6px;font-size:7px;border-radius:3px">
                  ${(report.status || 'baru').toUpperCase()}
                </span>
              </div>
              <div style="margin-bottom:4px"><strong>NAMA:</strong> ${report.name || 'N/A'}</div>
              <div style="margin-bottom:4px"><strong>USER ID:</strong> ${report.userid || 'N/A'}</div>
              <div style="margin-bottom:4px"><strong>PESAN:</strong></div>
              <div style="color:#60a5fa">${report.message || 'No message'}</div>
              ${report.fileName ? `<div style="margin-top:6px;color:#86efac;font-size:7px">📎 ${report.fileName}</div>` : ''}
            </div>
          </div>
        `
      }).join('')
    } else {
      container.innerHTML = '<div class="empty-history">BELUM ADA HISTORY</div>'
    }
  } catch (err) {
    container.innerHTML = '<div class="empty-history">GAGAL MEMUAT HISTORY</div>'
  }
}

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  showAlert({
    type: 'confirm',
    title: 'LOGOUT',
    message: 'Keluar dari history?',
    onConfirm: async () => {
      await fetch('/api/logout', {method: 'POST'})
      document.getElementById('passwordModal').style.display = 'block'
      document.getElementById('filterSection').style.display = 'none'
      document.getElementById('historyContainer').style.display = 'none'
      document.getElementById('logoutBtn').style.display = 'none'
      showAlert({type: 'info', title: 'LOGGED OUT', message: 'Berhasil logout'})
    }
  })
})

document.getElementById('statusFilter')?.addEventListener('change', e => loadHistory(e.target.value))

const audioContext = new (window.AudioContext || window.webkitAudioContext)()

function playBeep(frequency = 440, duration = 100) {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  oscillator.frequency.value = frequency
  oscillator.type = 'square'
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000)
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + duration / 1000)
}

fileInput.onchange = () => {
  const file = fileInput.files[0]
  if (!file) return
  playBeep(600, 50)
  const fileSizeMB = file.size / 1024 / 1024
  const isVideo = file.type.startsWith('video')
  if (file.size > 20 * 1024 * 1024) {
    showAlert({type: 'error', title: 'FILE TOO LARGE', message: `File size: ${fileSizeMB.toFixed(2)}MB. Maximum is 20MB.`, icon: '❌'})
    playBeep(200, 200)
    fileInput.value = ''
    return
  }
  if (isVideo && file.size > 10 * 1024 * 1024) {
    showAlert({type: 'warning', title: 'LARGE VIDEO', message: `Video size: ${fileSizeMB.toFixed(2)}MB. Upload may take longer.`, icon: '⚠️'})
  }
  preview.innerHTML = ''
  preview.style.display = 'block'
  fileLabel.innerHTML = `📁 ${file.name.toUpperCase()}`
  const removeBtn = document.createElement('button')
  removeBtn.className = 'remove-preview'
  removeBtn.innerHTML = '×'
  removeBtn.onclick = e => {
    e.preventDefault()
    playBeep(400, 50)
    fileInput.value = ''
    preview.style.display = 'none'
    preview.innerHTML = ''
    fileLabel.innerHTML = '📁 KLIK UNTUK UPLOAD'
  }
  preview.appendChild(removeBtn)
  const objectUrl = URL.createObjectURL(file)
  if (file.type.startsWith('image')) {
    const img = new Image()
    img.onload = () => URL.revokeObjectURL(objectUrl)
    img.src = objectUrl
    img.style.maxHeight = '240px'
    img.style.objectFit = 'contain'
    preview.appendChild(img)
  } else if (file.type.startsWith('video')) {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.controls = true
    video.style.maxHeight = '240px'
    video.style.objectFit = 'contain'
    video.onloadedmetadata = () => URL.revokeObjectURL(objectUrl)
    video.src = objectUrl
    preview.appendChild(video)
    const sizeInfo = document.createElement('div')
    sizeInfo.style.cssText = 'padding:8px;margin-top:8px;background:rgba(91,141,239,0.1);border:2px solid #5b8def;font-size:7px;color:#7dd3fc;text-align:center'
    sizeInfo.innerHTML = `📊 VIDEO SIZE: ${fileSizeMB.toFixed(2)}MB / 20MB MAX`
    preview.appendChild(sizeInfo)
  } else {
    const fileInfo = document.createElement('div')
    fileInfo.style.padding = '20px'
    fileInfo.style.textAlign = 'center'
    fileInfo.style.fontSize = '9px'
    fileInfo.style.color = '#7dd3fc'
    fileInfo.innerHTML = `<div style="margin-bottom:10px">📄 ${file.name}</div><div style="color:#60a5fa">${(file.size/1024).toFixed(2)} KB</div>`
    preview.appendChild(fileInfo)
  }
}

function showStatus(message, type = 'info') {
  statusDiv.textContent = message.toUpperCase()
  statusDiv.className = `status ${type}`
  if (type === 'success') {playBeep(800, 50); setTimeout(() => playBeep(1000, 50), 100)}
  else if (type === 'error') {playBeep(200, 100); setTimeout(() => playBeep(150, 100), 150)}
  else {playBeep(600, 50)}
  setTimeout(() => {statusDiv.textContent = ''; statusDiv.className = 'status'}, 5000)
}

form.onsubmit = async e => {
  e.preventDefault()
  const name = document.getElementById('name').value.trim()
  const userid = document.getElementById('userid').value.trim()
  const message = document.getElementById('message').value.trim()
  if (!name) {showAlert({type:'warning', title:'WARNING', message:'Nama wajib diisi!', icon:'⚠️'}); document.getElementById('name').focus(); return}
  if (!userid) {showAlert({type:'warning', title:'WARNING', message:'User ID wajib diisi!', icon:'⚠️'}); document.getElementById('userid').focus(); return}
  if (!message) {showAlert({type:'warning', title:'WARNING', message:'Pesan wajib diisi!', icon:'⚠️'}); document.getElementById('message').focus(); return}
  showAlert({
    type: 'confirm',
    title: 'CONFIRM',
    message: 'Kirim pesan sekarang?',
    icon: '❓',
    confirmText: 'KIRIM',
    cancelText: 'BATAL',
    onConfirm: async () => {
      btn.disabled = true
      let loadingDots = 0
      const loadingText = ['SENDING','SENDING.','SENDING..','SENDING...']
      const loadingInterval = setInterval(() => {
        btn.innerHTML = `<span class="blink">▸</span> ${loadingText[loadingDots%4]} <span class="blink">◂</span>`
        loadingDots++
      }, 200)
      showStatus('MENGIRIM PESAN...', 'info')
      const fd = new FormData(form)
      try {
        const res = await fetch('/api/report', {method: 'POST', body: fd})
        const json = await res.json()
        clearInterval(loadingInterval)
        if (json.status) {
          showStatus('✓ PESAN BERHASIL TERKIRIM!', 'success')
          playBeep(600, 100); setTimeout(() => playBeep(800, 100), 100); setTimeout(() => playBeep(1000, 200), 200)
          showAlert({
            type: 'success',
            title: 'SUCCESS',
            message: 'Pesan berhasil dikirim ke owner!',
            icon: '✅',
            onConfirm: () => {
              form.reset()
              preview.style.display = 'none'
              preview.innerHTML = ''
              fileLabel.innerHTML = '📁 KLIK UNTUK UPLOAD'
              btn.disabled = false
              btn.innerHTML = '<span class="blink">▸</span> KIRIM <span class="blink">◂</span>'
            }
          })
        } else {
          showStatus('✗ ' + (json.message || 'GAGAL MENGIRIM').toUpperCase(), 'error')
          showAlert({type: 'error', title: 'ERROR', message: json.message || 'Gagal mengirim pesan', icon: '❌'})
          btn.disabled = false
          btn.innerHTML = '<span class="blink">▸</span> KIRIM <span class="blink">◂</span>'
        }
      } catch (error) {
        clearInterval(loadingInterval)
        console.error('Fetch error:', error)
        showStatus('✗ GAGAL TERHUBUNG KE SERVER', 'error')
        showAlert({type: 'error', title: 'CONNECTION ERROR', message: 'Gagal terhubung ke server. Coba lagi nanti.', icon: '❌'})
        btn.disabled = false
        btn.innerHTML = '<span class="blink">▸</span> KIRIM <span class="blink">◂</span>'
      }
    },
    onCancel: () => showStatus('', '')
  })
}

document.getElementById('name').addEventListener('input', function() {this.value = this.value.substring(0, 100)})
document.getElementById('userid').addEventListener('input', function() {this.value = this.value.substring(0, 50)})
document.getElementById('message').addEventListener('input', function() {this.value = this.value.substring(0, 2000)})

document.querySelectorAll('input, textarea, select').forEach(input => {
  input.addEventListener('focus', () => playBeep(500, 30))
})

let konamiCode = []
const konamiSequence = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']

document.addEventListener('keydown', e => {
  konamiCode.push(e.key)
  konamiCode = konamiCode.slice(-10)
  if (konamiCode.join(',') === konamiSequence.join(',')) {
    document.body.style.animation = 'none'
    document.body.style.background = 'linear-gradient(45deg, #f472b6, #5b8def, #a5b4fc, #f472b6)'
    document.body.style.backgroundSize = '400% 400%'
    document.body.style.animation = 'gradient 3s ease infinite'
    const style = document.createElement('style')
    style.textContent = '@keyframes gradient{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}'
    document.head.appendChild(style)
    playBeep(523, 150); setTimeout(() => playBeep(659, 150), 150); setTimeout(() => playBeep(784, 150), 300); setTimeout(() => playBeep(1047, 300), 450)
    showStatus('🎮 KONAMI CODE ACTIVATED! 🎮', 'success')
    setTimeout(() => {
      document.body.style.animation = 'flicker 5s infinite'
      document.body.style.background = '#0a0e27'
    }, 5000)
  }
})

console.log('%c▸ REQ & REPORT BY FILNZ ◂', 'color:#7dd3fc;font-size:20px;font-family:monospace;text-shadow:0 0 10px #5b8def')
console.log('%cTry the Konami Code: ↑ ↑ ↓ ↓ ← → ← → B A', 'color:#60a5fa;font-family:monospace')
