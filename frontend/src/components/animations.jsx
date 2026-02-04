'use client';

import { motion } from 'framer-motion';
import React from 'react';

// Fade in animation component
export function FadeIn({
    children,
    delay = 0,
    duration = 0.5,
    direction = 'up',
    className = ''
}) {
    const directionOffset = {
        up: { y: 20 },
        down: { y: -20 },
        left: { x: 20 },
        right: { x: -20 }
    };

    return (
        <motion.div
            initial={{
                opacity: 0,
                ...directionOffset[direction]
            }}
            animate={{
                opacity: 1,
                x: 0,
                y: 0
            }}
            transition={{
                duration,
                delay,
                ease: [0.25, 0.25, 0, 1]
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Stagger container for animating children in sequence
export function StaggerContainer({
    children,
    staggerDelay = 0.1,
    className = ''
}) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: staggerDelay
                    }
                }
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Individual stagger item
export function StaggerItem({ children, className = '' }) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                        duration: 0.5,
                        ease: [0.25, 0.25, 0, 1]
                    }
                }
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Scale on hover animation
export function ScaleOnHover({
    children,
    scale = 1.02,
    className = ''
}) {
    return (
        <motion.div
            whileHover={{ scale }}
            whileTap={{ scale: 0.98 }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 20
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Slide in from direction
export function SlideIn({
    children,
    direction = 'left',
    delay = 0,
    duration = 0.6,
    className = ''
}) {
    const directionOffset = {
        left: { x: -100 },
        right: { x: 100 },
        up: { y: -100 },
        down: { y: 100 }
    };

    return (
        <motion.div
            initial={{
                opacity: 0,
                ...directionOffset[direction]
            }}
            animate={{
                opacity: 1,
                x: 0,
                y: 0
            }}
            transition={{
                duration,
                delay,
                ease: [0.25, 0.25, 0, 1]
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Bounce entrance animation
export function BounceIn({
    children,
    delay = 0,
    className = ''
}) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                scale: 0.3
            }}
            animate={{
                opacity: 1,
                scale: 1
            }}
            transition={{
                duration: 0.6,
                delay,
                ease: [0.25, 0.46, 0.45, 0.94],
                scale: {
                    type: "spring",
                    damping: 8,
                    stiffness: 100
                }
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Page transition wrapper
export function PageTransition({ children, className = '' }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{
                duration: 0.3,
                ease: [0.25, 0.25, 0, 1]
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Button hover animation
export function AnimatedButton({ children, className = '', onClick }) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 17
            }}
            className={className}
            onClick={onClick}
        >
            {children}
        </motion.button>
    );
}

// Form field entrance animation
export function FormFieldAnimation({ children, delay = 0, className = '' }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
                duration: 0.4,
                delay,
                ease: [0.25, 0.25, 0, 1]
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Loading spinner animation
export function LoadingSpinner({ size = 24, className = '' }) {
    return (
        <motion.div
            animate={{ rotate: 360 }}
            transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
            }}
            className={className}
            style={{ width: size, height: size }}
        >
            <div className="w-full h-full border-2 border-current border-t-transparent rounded-full" />
        </motion.div>
    );
}

// Card flip animation
export function FlipCard({ children, isFlipped = false, className = '' }) {
    return (
        <motion.div
            initial={false}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d" }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Pulse animation for notifications
export function Pulse({ children, className = '' }) {
    return (
        <motion.div
            animate={{
                scale: [1, 1.05, 1],
                opacity: [1, 0.8, 1]
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
