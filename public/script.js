const btn = document.getElementById('send')
const fileInput = document.getElementById('fileInput')
const preview = document.getElementById('preview')

fileInput.onchange = () => {
  const file = fileInput.files[0]
  if (!file) return

  preview.innerHTML = ''
  preview.style.display = 'block'

  if (file.type.startsWith('image')) {
    const img = document.createElement('img')
    img.src = URL.createObjectURL(file)
    preview.appendChild(img)
  } else if (file.type.startsWith('video')) {
    const video = document.createElement('video')
    video.src = URL.createObjectURL(file)
    video.controls = true
    preview.appendChild(video)
  }
}

btn.onclick = async () => {
  const message = document.getElementById('message').value
  if (!message) return alert('Pesan wajib diisi')

  btn.disabled = true
  btn.innerText = 'Mengirim...'

  const fd = new FormData()
  fd.append('type', type.value)
  fd.append('name', name.value)
  fd.append('userid', userid.value)
  fd.append('message', message)
  if (fileInput.files[0]) fd.append('file', fileInput.files[0])

  try {
    const res = await fetch('/api/report', { method: 'POST', body: fd })
    const json = await res.json()
    alert(json.message)
    location.reload()
  } catch {
    alert('Gagal mengirim')
  }
}
