# EPI Rental - Frontend SaaS Specification

## Overview

EPI Rental is a frontend-only simulation of a cloud VM rental platform inspired by AWS, Proxmox, and Azure.

The goal is to create a realistic SaaS dashboard experience without a backend.

---

## Core Features

### 1. Authentication (Simulated)

* Login/Register UI
* Store session in localStorage
* Role-based UI (Admin / Client)

---

### 2. Dashboard

* Metrics cards:

  * Active VMs
  * CPU Usage
  * Storage Usage
  * Monthly Cost
* VM table with:

  * Name
  * Status
  * Resources
  * Actions

---

### 3. VM Management

* Create VM (form)
* Simulated provisioning pipeline
* VM states:

  * running
  * stopped
  * provisioning

---

### 4. VM Details View

* CPU graph
* RAM graph
* VM metadata (IP, OS, uptime)
* Action buttons

---

### 5. Activity System

* Timeline of events:

  * VM created
  * VM started/stopped
  * Payment activated
* Stored in memory (frontend only)

---

### 6. Admin Panel

* User list
* VM overview
* Revenue stats

---

### 7. Subscription

* Plans:

  * Starter
  * Professional
* Fake payment system
* Plan selection UI

---

### 8. UI/UX Enhancements

#### Command Palette

* Shortcut: Ctrl + K
* Navigate pages and actions

#### Notifications

* Bell icon
* Dropdown list

#### Filters & Search

* Filter VMs by status, OS
* Search by name

#### Theme

* Dark / Light toggle

#### Empty States

* Friendly UI when no data

---

### 9. Real-Time Simulation

* CPU/RAM values update every few seconds
* Graphs animate

---

### 10. Deployment Pipeline

Steps:

1. Terraform
2. Jenkins
3. Proxmox
4. Running

Animated step-by-step UI

---

## Tech Stack

* HTML5
* CSS3 (modern layout, flex/grid)
* Vanilla JavaScript
* Optional: Chart.js

---

## Goal

Deliver a frontend that feels like a real production SaaS cloud platform. 
