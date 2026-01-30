"use client";

import React, { useRef, useEffect, useState } from "react";
import Button from "../button/Button";

interface SignaturePadProps {
    onSave: (signature: string) => void;
    onClear?: () => void;
    width?: number;
    height?: number;
    penColor?: string;
    lineWidth?: number;
}

const SignaturePad: React.FC<SignaturePadProps> = ({
    onSave,
    onClear,
    width = 500,
    height = 200,
    penColor = "#000",
    lineWidth = 2,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas resolution for better quality
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = penColor;
        ctx.lineWidth = lineWidth;
    }, [penColor, lineWidth]);

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ("touches" in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;

        ctx.lineTo(x, y);
        ctx.stroke();
        setIsEmpty(false);
    };

    const endDrawing = () => {
        setIsDrawing(false);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
        if (onClear) onClear();
    };

    const save = () => {
        if (isEmpty) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dataUrl = canvas.toDataURL("image/png");
        onSave(dataUrl);
    };

    return (
        <div className="flex flex-col gap-4">
            <div
                className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 overflow-hidden touch-none"
                style={{ width: '100%', height: `${height}px` }}
            >
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={endDrawing}
                    onMouseOut={endDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={endDrawing}
                    className="w-full h-full cursor-crosshair"
                />
            </div>

            <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 italic">
                    {isEmpty ? "Dibuja tu firma en el recuadro superior" : "Firma capturada"}
                </span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={clear}>
                        Limpiar
                    </Button>
                    <Button size="sm" onClick={save} disabled={isEmpty}>
                        Confirmar Firma
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SignaturePad;
