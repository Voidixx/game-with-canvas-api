# Adventure Game

## Overview

An HTML5 canvas-based adventure game built with vanilla JavaScript. The project implements a client-side game engine with dynamic asset loading, responsive design, and mobile-first optimization. The game features a custom loading screen system and is designed to run in web environments, particularly suited for platforms like Replit.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Canvas-based Rendering**: Uses HTML5 Canvas API for all game graphics and animations
- **Vanilla JavaScript**: No external frameworks, keeping the codebase lightweight and dependency-free
- **Responsive Design**: Implements dynamic sizing functions for cross-device compatibility
- **Mobile-First Approach**: Optimized for touch devices with viewport meta tags and touch event handling

### Asset Management System
- **Dynamic Image Loading**: Custom `loadImages()` function with Promise-based asynchronous loading
- **Loading Screen**: Animated progress indicator with gradient backgrounds and real-time progress updates
- **Image Caching**: Pre-loads and stores game assets in a global `images` object for efficient access

### Game Engine Components
- **Canvas Context Management**: Global canvas context (`c`) for centralized rendering operations
- **Animation Loop**: RequestAnimationFrame-based rendering system for smooth 60fps performance
- **Event System**: Touch and mouse input handling optimized for mobile devices

### Server Architecture
- **Dual Server Support**: Both Node.js (Express) and Python (SimpleHTTPServer) implementations
- **Static File Serving**: Serves game assets directly from the project root
- **Cache Control**: Implements no-cache headers to prevent asset caching issues in development
- **Cross-Origin Headers**: Configured for iframe embedding in platforms like Replit

## External Dependencies

### Runtime Dependencies
- **Express.js**: Node.js web server framework for static file serving and development server
- **Node.js Built-in HTTP**: Alternative Python server using built-in HTTP server module

### Development Environment
- **Replit Platform**: Designed specifically for Replit's containerized environment
- **Cross-Platform Compatibility**: Works across different operating systems and browsers
- **Mobile Web Standards**: Follows PWA guidelines for mobile web applications

### Browser APIs
- **HTML5 Canvas API**: Core rendering and graphics operations
- **File API**: For dynamic asset loading and management
- **RequestAnimationFrame**: For smooth animation loops and performance optimization