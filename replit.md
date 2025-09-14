# Gunbattle.io

## Overview

A real-time multiplayer battle royale game built with Node.js, Express, Socket.IO, and HTML5 Canvas. The project features a real-time multiplayer server, client-side game engine with dynamic asset loading, responsive design, and mobile-first optimization. Players can join the game, move around a 2D world, and shoot projectiles at each other in real-time. The game is optimized for the Replit environment.

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
- **Node.js Backend**: Express.js server with Socket.IO for real-time multiplayer communication
- **Real-time Multiplayer**: WebSocket-based game state synchronization for multiple players
- **Game State Management**: Server-side player tracking, movement validation, and projectile physics
- **Static File Serving**: Serves game assets directly from the project root
- **Cache Control**: Implements no-cache headers to prevent asset caching issues in development
- **Cross-Origin Headers**: Configured for iframe embedding in platforms like Replit

## External Dependencies

### Runtime Dependencies
- **Express.js**: Node.js web server framework for static file serving and HTTP server
- **Socket.IO**: Real-time bidirectional event-based communication for multiplayer functionality
- **UUID**: For generating unique identifiers for game objects like projectiles

### Development Environment
- **Replit Platform**: Designed specifically for Replit's containerized environment
- **Cross-Platform Compatibility**: Works across different operating systems and browsers
- **Mobile Web Standards**: Follows PWA guidelines for mobile web applications

### Browser APIs
- **HTML5 Canvas API**: Core rendering and graphics operations
- **File API**: For dynamic asset loading and management
- **RequestAnimationFrame**: For smooth animation loops and performance optimization