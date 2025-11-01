# 🛰️ REALG — Real-time Emergency Alert & Location Geofencing System

**Filed for Patent on May 7, 2025**

---

## 🚧 Overview

**REALG (Real-time Emergency Alert & Location Geofencing)** is an **IoT + AI-powered safety system** designed for construction sites to ensure worker safety, monitor real-time risks, and provide instant emergency alerts even in the absence of network connectivity.

The system combines **LoRa communication**, **GPS-based tracking**, **AI-driven CCTV monitoring**, and **machine learning-based weather and PPE compliance prediction** to create an **end-to-end safety management platform**.

---

## 🧠 Problem Statement

Construction sites are inherently high-risk zones where workers face threats such as:

- Falls from heights or scaffolds  
- Equipment collisions or falling debris  
- Electrocution and exposure to hazardous materials  
- Noise-induced hearing loss and respiratory issues  
- Inefficient site planning and poor emergency response  

REALG addresses these challenges by integrating **predictive, preventive, and proactive** safety mechanisms.

---

## 💡 Solution Overview

REALG enables **situational awareness**, **safety compliance**, and **real-time decision-making** through four core modules:

1. **Wearable Worker Device**  
2. **Supervisor Device**  
3. **LoRa-enabled Geofence Cone**  
4. **REALG Website Dashboard**

Each module communicates using **LoRa Peer-to-Peer (P2P)** networks for long-range, low-power, and network-independent connectivity.

---

## 🧩 System Components

### 🧍‍♂️ 1. Wearable Worker Device

A compact IoT device worn on the worker’s belt that provides:
- **SOS Alerts** with GPS coordinates via **LoRa P2P**
- **RSSI-based geofencing detection**
- **NFC tag-based attendance logging**
- **LED and buzzer feedback**
- Battery life up to **30 days**

**Modules Used:**  
`LoRa SX1276`, `NEO-6M GPS`, `ESP32`, `NFC Sticker Tag`

---

### 📱 2. Supervisor Device

A handheld unit that serves as the **central field receiver** for all safety data:
- Receives alerts from worker devices over **LoRa**
- Displays messages and triggers LED/buzzer feedback
- Forwards data to the **REALG Website** over Wi-Fi
- Handles **NFC attendance scanning** using `PN532`

**Battery life:** ~30 days  
**Communication:** LoRa P2P + Wi-Fi

---

### 🪩 3. LoRa-enabled Geofence Cone

A **portable cone device** that marks high-risk zones:
- Detects nearby workers using **RSSI signal strength**
- Triggers alarms and LED warnings on **geofence breach**
- Sends breach data to the supervisor and REALG website
- Operates without line-of-sight (direction-independent)
- Battery lasts up to **45 days**

Ideal for use near **cranes**, **excavation zones**, and **high-voltage areas**.

---

### 🌐 4. REALG Website Dashboard

A centralized online platform for:
- Real-time safety alert visualization  
- Worker attendance and location tracking  
- PPE compliance and risk analytics  
- Map-based navigation via **Google Maps API**

---

## 🧠 AI-Driven Safety Intelligence

### ⚙️ PPE Compliance Detection
- Built using **YOLOv8** object detection model.  
- Detects whether workers are wearing helmets, vests, etc.  
- Automatically logs non-compliance incidents.

### 🌦️ Adaptive Weather Intelligence
- Integrates **OpenWeather API** for real-time weather data.  
- Predicts crane operation safety and environmental risk factors using ML algorithms.

### 🎥 AI-based CCTV Monitoring
- Detects worker movements in danger zones through visual analysis.  
- Instantly alerts supervisors via the REALG website.

### 🗺️ Smart Site Planning
- Merges site blueprints with real-time worker data.  
- Allows supervisors to map safe zones, machinery positions, and entry points.

---

## 🧰 Tech Stack

| Layer | Technologies |
|-------|---------------|
| **Hardware** | LoRa SX1276, NEO-6M GPS, PN532 NFC, ESP32 |
| **Software / Firmware** | Arduino IDE, C/C++ |
| **AI/ML** | Python, YOLOv8, OpenCV, TensorFlow |
| **Web Dashboard** | HTML, CSS, JavaScript, Node.js |
| **Communication** | LoRa P2P, Wi-Fi, MQTT |
| **Database** | Firebase / MySQL |
| **API** | OpenWeather API, Google Maps API |

---

## 🔔 Key Features

- **Network-independent emergency alerts** using LoRa  
- **GPS-based location tracking**  
- **AI-powered PPE compliance and safety monitoring**  
- **RSSI-based geofencing detection** (no line-of-sight required)  
- **Smart attendance tracking** using NFC  
- **Predictive analytics for site safety**  

---

## 🧪 Prototype Details

| Component | Avg. Cost | Battery Life |
|------------|------------|--------------|
| Worker Device | ₹800 | ~30 Days |
| Supervisor Device | ₹1000 | ~30 Days |
| Geofence Cone | ₹1200 | ~45 Days |

---

## 🌍 Extended Applications

Beyond construction sites, REALG can serve:
- **Disaster response operations** during power or network outages  
- **Military and border safety** (e.g., LOC/POK) using network-free LoRa alerts  
- **Industrial environments** with hazardous conditions  

---

## 🚀 Future Scope

- Design **custom PCBs** to reduce prototype size  
- Integrate device into **helmets or vests**  
- Add sensors to detect **unconscious workers** automatically  
- Cloud-based **AI analytics dashboard** for large-scale deployment  

---

## 👨‍🔬 Team & Mentorship

**Team ID:** 2505ID11  
**Project Title:** Safety in Construction Sites  

**Team Members:**
- Kovarthan Manikandan – B.E. Mechanical Engineering  
- Deepak Chandrasekar – B.Tech. CSBS  
- Abhimanya S – B.Tech. CSBS  
- Muthu Harish T – B.Tech. CSBS  

**Mentors:**
- Dr. J. Nagarjun, Assistant Professor, Mechanical Engineering  
- Dr. R. Manimegalai, Professor, Computer Science Engineering  

---


## 📜 License

This project is protected under **Patent Filing (7 May 2025)**.  
All rights reserved by the **REALG Team**.

---
