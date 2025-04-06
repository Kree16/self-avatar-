// ================= 3D AVATAR =================
let scene, camera, renderer, avatar;

function initAvatar() {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfaf5ff);
  
  // Camera
  camera = new THREE.PerspectiveCamera(75, document.getElementById('avatar-container').clientWidth / document.getElementById('avatar-container').clientHeight, 0.1, 1000);
  camera.position.z = 5;
  
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(document.getElementById('avatar-container').clientWidth, document.getElementById('avatar-container').clientHeight);
  document.getElementById('avatar-container').appendChild(renderer.domElement);
  
  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(0, 1, 1);
  scene.add(directionalLight);
  
  // Load 3D model (replace with your GLTF model)
  const loader = new THREE.GLTFLoader();
  loader.load('assets/avatar.glb', (gltf) => {
    avatar = gltf.scene;
    scene.add(avatar);
  }, undefined, (error) => {
    console.error('Error loading 3D model:', error);
    // Fallback cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0x8a63ff });
    avatar = new THREE.Mesh(geometry, material);
    scene.add(avatar);
  });
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    if (avatar) avatar.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();
  
  // Handle resize
  window.addEventListener('resize', () => {
    camera.aspect = document.getElementById('avatar-container').clientWidth / document.getElementById('avatar-container').clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(document.getElementById('avatar-container').clientWidth, document.getElementById('avatar-container').clientHeight);
  });
}

// ================= CAMERA EMOTION DETECTION =================
let emotionDetectionInterval;

async function setupCamera() {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    
    document.getElementById('emotion-btn').addEventListener('click', () => {
      if (emotionDetectionInterval) {
        clearInterval(emotionDetectionInterval);
        emotionDetectionInterval = null;
        document.getElementById('emotion-btn').textContent = '😊 Detect Emotion';
      } else {
        emotionDetectionInterval = setInterval(() => detectEmotion(video, canvas, ctx), 1000);
        document.getElementById('emotion-btn').textContent = '❌ Stop';
      }
    });
  } catch (err) {
    console.error('Camera error:', err);
    document.getElementById('camera-feed').style.display = 'none';
  }
}

async function detectEmotion(video, canvas, ctx) {
  // Draw video frame to canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = canvas.toDataURL('image/jpeg');
  
  // Send to backend for emotion analysis
  try {
    const response = await fetch('/analyze-emotion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData })
    });
    const { emotion } = await response.json();
    addMessage(`I see you're feeling ${emotion}.`, 'ai');
    speak(`You seem ${emotion}. Would you like to talk about it?`);
  } catch (err) {
    console.error('Emotion detection failed:', err);
  }
}

// ================= VOICE & CHAT =================
const synth = window.speechSynthesis;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;

function setupVoice() {
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById('user-input').value = transcript;
    sendMessage();
  };
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    document.getElementById('voice-btn').textContent = '🎤';
  };
  
  document.getElementById('voice-btn').addEventListener('click', () => {
    if (document.getElementById('voice-btn').textContent === '🎤') {
      recognition.start();
      document.getElementById('voice-btn').textContent = '🔴';
    } else {
      recognition.stop();
      document.getElementById('voice-btn').textContent = '🎤';
    }
  });
}

function speak(text) {
  if (synth.speaking) synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = synth.getVoices().find(v => v.name.includes('Google UK English Female')) || synth.getVoices()[0];
  synth.speak(utterance);
}

// ================= CHAT FUNCTIONALITY =================
async function sendMessage() {
  const message = document.getElementById('user-input').value.trim();
  if (!message) return;
  
  addMessage(message, 'user');
  document.getElementById('user-input').value = '';
  
  // Show typing indicator
  const typingIndicator = document.createElement('div');
  typingIndicator.className = 'typing-indicator';
  typingIndicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  document.getElementById('chat-messages').appendChild(typingIndicator);
  document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
  
  // Get AI response
  try {
    const response = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    const { reply } = await response.json();
    
    document.getElementById('chat-messages').removeChild(typingIndicator);
    addMessage(reply, 'ai');
    speak(reply);
  } catch (err) {
    console.error('Chat error:', err);
    const fallbackReply = "I'm having trouble connecting. Let's try again later.";
    addMessage(fallbackReply, 'ai');
    speak(fallbackReply);
  }
}

function addMessage(text, sender) {
  const messageElement = document.createElement('div');
  messageElement.className = `message ${sender}-message`;
  messageElement.textContent = text;
  document.getElementById('chat-messages').appendChild(messageElement);
  document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
}

// ================= INITIALIZE =================
document.addEventListener('DOMContentLoaded', () => {
  initAvatar();
  setupCamera();
  setupVoice();
  
  // Event listeners
  document.getElementById('send-btn').addEventListener('click', sendMessage);
  document.getElementById('user-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
  
  document.getElementById('hug-btn').addEventListener('click', () => {
    addMessage("Sending a warm hug... 🤗", 'ai');
    speak("Here's a virtual hug for you!");
    // In a real app, trigger physical hardware here
  });
  
  // Initial greeting
  setTimeout(() => {
    speak("Hello! I'm your Self Avatar. How are you feeling today?");
  }, 1000);
});