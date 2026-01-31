const btn = document.getElementById('send')
const fileInput = document.getElementById('fileInput')
const preview = document.getElementById('preview')
const statusDiv = document.getElementById('status')
const fileLabel = document.getElementById('fileLabel')
const form = document.getElementById('formPage')

// Sidebar Navigation
const sidebar = document.getElementById('sidebar')
const sidebarToggle = document.getElementById('sidebarToggle')
const sidebarClose = document.getElementById('sidebarClose')
const overlay = document.getElementById('overlay')
const navItems = document.querySelectorAll('.nav-item')
const pages = document.querySelectorAll('.page-content')

// Toggle Sidebar
function toggleSidebar() {
  sidebar.classList.toggle('active')
  overlay.classList.toggle('active')
  playBeep(600, 50)
}

sidebarToggle.addEventListener('click', toggleSidebar)
sidebarClose.addEventListener('click', toggleSidebar)
overlay.addEventListener('click', toggleSidebar)

// Page Navigation
navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault()
    const targetPage = item.dataset.page
    
    // Update active nav item
    navItems.forEach(nav => nav.classList.remove('active'))
    item.classList.add('active')
    
    // Show target page
    pages.forEach(page => page.classList.remove('active'))
    document.getElementById(targetPage + 'Page').classList.add('active')
    
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      toggleSidebar()
    }
    
    // Load history if history page
    if (targetPage === 'history') {
      loadHistory()
    }
    
    playBeep(700, 50)
  })
})

// Load History Function
async function loadHistory(status = '') {
  const historyContainer = document.getElementById('historyContainer')
  historyContainer.innerHTML = '<div class="loading-text">LOADING HISTORY...</div>'
  
  try {
    // Build URL with status filter
    let url = '/api/history';
    if (status) {
      url += `?status=${status}`;
    }
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error('Failed to load history')
    }
    
    const data = await response.json()
    
    if (data.reports && data.reports.length > 0) {
      historyContainer.innerHTML = data.reports.map(report => {
        // Status color
        const statusColors = {
          'baru': '#a5b4fc',
          'diproses': '#fbbf24',
          'selesai': '#86efac'
        };
        const statusColor = statusColors[report.status] || '#60a5fa';
        
        return `
        <div class="history-item">
          <div class="history-item-header">
            <span class="history-type">${(report.type || 'UNKNOWN').toUpperCase()}</span>
            <span class="history-date">${report.createdAt ? new Date(report.createdAt).toLocaleDateString('id-ID', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'N/A'}</span>
          </div>
          <div class="history-body">
            <div style="margin-bottom: 6px;">
              <span style="background: ${statusColor}22; border: 1px solid ${statusColor}; color: ${statusColor}; padding: 2px 6px; font-size: 7px; border-radius: 3px;">
                ${(report.status || 'baru').toUpperCase()}
              </span>
            </div>
            <div style="margin-bottom: 4px;"><strong>NAMA:</strong> ${report.name || 'N/A'}</div>
            <div style="margin-bottom: 4px;"><strong>USER ID:</strong> ${report.userid || 'N/A'}</div>
            <div style="margin-bottom: 4px;"><strong>PESAN:</strong></div>
            <div style="color: #60a5fa;">${report.message || 'No message'}</div>
            ${report.fileName ? `<div style="margin-top: 6px; color: #86efac; font-size: 7px;">📎 ${report.fileName}</div>` : ''}
          </div>
        </div>
      `}).join('')
    } else {
      historyContainer.innerHTML = `
        <div class="empty-history">
          <div style="font-size: 24px; margin-bottom: 10px;">📭</div>
          <div>BELUM ADA HISTORY</div>
        </div>
      `
    }
  } catch (error) {
    console.error('Error loading history:', error)
    historyContainer.innerHTML = `
      <div class="empty-history">
        <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
        <div>GAGAL MEMUAT HISTORY</div>
        <div style="color: #fca5a5; margin-top: 8px; font-size: 7px;">${error.message}</div>
      </div>
    `
  }
}

// Status filter event listener
document.addEventListener('DOMContentLoaded', () => {
  const statusFilter = document.getElementById('statusFilter')
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      playBeep(600, 50)
      loadHistory(e.target.value)
    })
  }
})


// 8-bit sound effects (optional - menggunakan Web Audio API)
const audioContext = new (window.AudioContext || window.webkitAudioContext)()

function playBeep(frequency = 440, duration = 100) {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  oscillator.frequency.value = frequency
  oscillator.type = 'square' // 8-bit sound
  
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + duration / 1000)
}

// Preview file dengan retro style
fileInput.onchange = () => {
  const file = fileInput.files[0]
  if (!file) return

  // Sound effect
  playBeep(600, 50)

  // Validasi ukuran file (50MB)
  if (file.size > 50 * 1024 * 1024) {
    showStatus('FILE TERLALU BESAR (MAX 50MB)', 'error')
    playBeep(200, 200)
    fileInput.value = ''
    return
  }

  preview.innerHTML = ''
  preview.style.display = 'block'
  fileLabel.innerHTML = `▶ ${file.name.toUpperCase()}`

  // Tambah tombol hapus preview
  const removeBtn = document.createElement('button')
  removeBtn.className = 'remove-preview'
  removeBtn.innerHTML = '×'
  removeBtn.onclick = (e) => {
    e.preventDefault()
    playBeep(400, 50)
    fileInput.value = ''
    preview.style.display = 'none'
    preview.innerHTML = ''
    fileLabel.innerHTML = '▶ KLIK UNTUK UPLOAD'
  }
  preview.appendChild(removeBtn)

  // Buat URL object dengan optimasi
  const objectUrl = URL.createObjectURL(file)

  if (file.type.startsWith('image')) {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
    }
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
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl)
    }
    
    video.src = objectUrl
    preview.appendChild(video)
  } else {
    // Untuk file lain, tampilkan info
    const fileInfo = document.createElement('div')
    fileInfo.style.padding = '20px'
    fileInfo.style.textAlign = 'center'
    fileInfo.style.fontSize = '9px'
    fileInfo.style.color = '#7dd3fc'
    fileInfo.innerHTML = `
      <div style="margin-bottom: 10px;">📄 ${file.name}</div>
      <div style="color: #60a5fa;">${(file.size / 1024).toFixed(2)} KB</div>
    `
    preview.appendChild(fileInfo)
  }
}

// Fungsi untuk menampilkan status dengan retro style
function showStatus(message, type = 'info') {
  statusDiv.textContent = message.toUpperCase()
  statusDiv.className = `status ${type}`
  
  // Sound effects
  if (type === 'success') {
    playBeep(800, 50)
    setTimeout(() => playBeep(1000, 50), 100)
  } else if (type === 'error') {
    playBeep(200, 100)
    setTimeout(() => playBeep(150, 100), 150)
  } else {
    playBeep(600, 50)
  }
  
  setTimeout(() => {
    statusDiv.textContent = ''
    statusDiv.className = 'status'
  }, 5000)
}

// Submit form dengan retro loading
form.onsubmit = async (e) => {
  e.preventDefault()
  
  const name = document.getElementById('name').value.trim()
  const userid = document.getElementById('userid').value.trim()
  const message = document.getElementById('message').value.trim()

  // Validasi input
  if (!name) {
    showStatus('NAMA WAJIB DIISI!', 'error')
    document.getElementById('name').focus()
    return
  }

  if (!userid) {
    showStatus('USER ID WAJIB DIISI!', 'error')
    document.getElementById('userid').focus()
    return
  }

  if (!message) {
    showStatus('PESAN WAJIB DIISI!', 'error')
    document.getElementById('message').focus()
    return
  }

  btn.disabled = true
  
  // Animasi loading retro
  let loadingDots = 0
  const loadingText = ['SENDING', 'SENDING.', 'SENDING..', 'SENDING...']
  const loadingInterval = setInterval(() => {
    btn.innerHTML = `<span class="blink">▸</span> ${loadingText[loadingDots % 4]} <span class="blink">◂</span>`
    loadingDots++
  }, 200)
  
  showStatus('MENGIRIM PESAN...', 'info')

  const fd = new FormData(form)
  
  try {
    const res = await fetch('/api/report', {
      method: 'POST',
      body: fd
    })

    const json = await res.json()
    
    clearInterval(loadingInterval)
    
    if (json.status) {
      showStatus('✓ PESAN BERHASIL TERKIRIM!', 'success')
      
      // Victory sound
      playBeep(600, 100)
      setTimeout(() => playBeep(800, 100), 100)
      setTimeout(() => playBeep(1000, 200), 200)
      
      setTimeout(() => {
        form.reset()
        preview.style.display = 'none'
        preview.innerHTML = ''
        fileLabel.innerHTML = '▶ KLIK UNTUK UPLOAD'
        btn.disabled = false
        btn.innerHTML = '<span class="blink">▸</span> KIRIM <span class="blink">◂</span>'
      }, 2000)
    } else {
      showStatus('✗ ' + (json.message || 'GAGAL MENGIRIM').toUpperCase(), 'error')
      btn.disabled = false
      btn.innerHTML = '<span class="blink">▸</span> KIRIM <span class="blink">◂</span>'
    }
  } catch (error) {
    clearInterval(loadingInterval)
    console.error('Fetch error:', error)
    showStatus('✗ GAGAL TERHUBUNG KE SERVER', 'error')
    btn.disabled = false
    btn.innerHTML = '<span class="blink">▸</span> KIRIM <span class="blink">◂</span>'
  }
}

// Tambah validasi real-time dengan sound
document.getElementById('name').addEventListener('input', function() {
  this.value = this.value.substring(0, 100)
})

document.getElementById('userid').addEventListener('input', function() {
  this.value = this.value.substring(0, 50)
})

document.getElementById('message').addEventListener('input', function() {
  this.value = this.value.substring(0, 2000)
})

// Sound effect saat focus input
const inputs = document.querySelectorAll('input, textarea, select')
inputs.forEach(input => {
  input.addEventListener('focus', () => {
    playBeep(500, 30)
  })
})

// Easter egg: konami code
let konamiCode = []
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

document.addEventListener('keydown', (e) => {
  konamiCode.push(e.key)
  konamiCode = konamiCode.slice(-10)
  
  if (konamiCode.join(',') === konamiSequence.join(',')) {
    // Secret retro animation
    document.body.style.animation = 'none'
    document.body.style.background = 'linear-gradient(45deg, #f472b6, #5b8def, #a5b4fc, #f472b6)'
    document.body.style.backgroundSize = '400% 400%'
    document.body.style.animation = 'gradient 3s ease infinite'
    
    const style = document.createElement('style')
    style.textContent = `
      @keyframes gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `
    document.head.appendChild(style)
    
    // Victory fanfare
    playBeep(523, 150)
    setTimeout(() => playBeep(659, 150), 150)
    setTimeout(() => playBeep(784, 150), 300)
    setTimeout(() => playBeep(1047, 300), 450)
    
    showStatus('🎮 KONAMI CODE ACTIVATED! 🎮', 'success')
    
    setTimeout(() => {
      document.body.style.animation = 'flicker 5s infinite'
      document.body.style.background = '#0a0e27'
    }, 5000)
  }
})

console.log('%c▸ RETRO TERMINAL v1.0 ◂', 'color: #7dd3fc; font-size: 20px; font-family: monospace; text-shadow: 0 0 10px #5b8def;')
console.log('%cTry the Konami Code: ↑ ↑ ↓ ↓ ← → ← → B A', 'color: #60a5fa; font-family: monospace;')
