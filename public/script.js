const btn = document.getElementById('send')
const fileInput = document.getElementById('fileInput')
const preview = document.getElementById('preview')
const statusDiv = document.getElementById('status')
const fileLabel = document.getElementById('fileLabel')
const form = document.getElementById('reportForm')

// Preview file dengan optimasi
fileInput.onchange = () => {
  const file = fileInput.files[0]
  if (!file) return

  // Validasi ukuran file (50MB)
  if (file.size > 50 * 1024 * 1024) {
    showStatus('File terlalu besar (maks 50MB)', 'error')
    fileInput.value = ''
    return
  }

  preview.innerHTML = ''
  preview.style.display = 'block'
  fileLabel.textContent = file.name

  // Tambah tombol hapus preview
  const removeBtn = document.createElement('button')
  removeBtn.className = 'remove-preview'
  removeBtn.innerHTML = '×'
  removeBtn.onclick = (e) => {
    e.preventDefault()
    fileInput.value = ''
    preview.style.display = 'none'
    preview.innerHTML = ''
    fileLabel.textContent = 'Klik untuk upload gambar / video'
  }
  preview.appendChild(removeBtn)

  // Buat URL object dengan optimasi
  const objectUrl = URL.createObjectURL(file)

  if (file.type.startsWith('image')) {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(objectUrl) // Bersihkan memory
    }
    img.src = objectUrl
    img.style.maxHeight = '240px'
    img.style.objectFit = 'contain'
    preview.appendChild(img)

  } else if (file.type.startsWith('video')) {
    const video = document.createElement('video')
    
    // ✅ PERBAIKAN: Optimasi video preview
    video.preload = 'metadata' // Hanya load metadata dulu
    video.controls = true
    video.style.maxHeight = '240px'
    video.style.objectFit = 'contain'
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl) // Bersihkan memory
    }
    
    video.src = objectUrl
    preview.appendChild(video)
  }
}

// Fungsi untuk menampilkan status
function showStatus(message, type = 'info') {
  statusDiv.textContent = message
  statusDiv.className = `status ${type}`
  setTimeout(() => {
    statusDiv.textContent = ''
    statusDiv.className = 'status'
  }, 5000)
}

// Submit form
form.onsubmit = async (e) => {
  e.preventDefault()
  
  const name = document.getElementById('name').value.trim()
  const userid = document.getElementById('userid').value.trim()
  const message = document.getElementById('message').value.trim()

  // Validasi input
  if (!name) {
    showStatus('Nama wajib diisi', 'error')
    document.getElementById('name').focus()
    return
  }

  if (!userid) {
    showStatus('ID wajib diisi', 'error')
    document.getElementById('userid').focus()
    return
  }

  if (!message) {
    showStatus('Pesan wajib diisi', 'error')
    document.getElementById('message').focus()
    return
  }

  btn.disabled = true
  btn.innerText = 'Mengirim...'
  showStatus('Mengirim pesan...', 'info')

  const fd = new FormData(form)
  
  // ✅ PERBAIKAN: Tambah error handling lebih baik
  try {
    const res = await fetch('/api/report', {
      method: 'POST',
      body: fd
    })

    const json = await res.json()
    
    if (json.status) {
      showStatus('Pesan berhasil dikirim!', 'success')
      setTimeout(() => {
        form.reset()
        preview.style.display = 'none'
        preview.innerHTML = ''
        fileLabel.textContent = 'Klik untuk upload gambar / video'
        btn.disabled = false
        btn.innerText = 'Kirim'
      }, 2000)
    } else {
      showStatus(json.message || 'Gagal mengirim pesan', 'error')
      btn.disabled = false
      btn.innerText = 'Kirim'
    }
  } catch (error) {
    console.error('Fetch error:', error)
    showStatus('Gagal terhubung ke server', 'error')
    btn.disabled = false
    btn.innerText = 'Kirim'
  }
}

// Tambah validasi real-time
document.getElementById('name').addEventListener('input', function() {
  this.value = this.value.substring(0, 100) // Batasi panjang nama
})

document.getElementById('userid').addEventListener('input', function() {
  this.value = this.value.substring(0, 50) // Batasi panjang ID
})

document.getElementById('message').addEventListener('input', function() {
  this.value = this.value.substring(0, 2000) // Batasi panjang pesan
})
