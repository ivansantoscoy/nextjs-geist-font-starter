"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import { performAnalysis, AnalysisResult } from "../lib/analysis";
import { Dashboard } from "../components/Dashboard";

export default function Home() {
  const [data, setData] = useState<any[] | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError("");
      setIsLoading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          if (typeof bstr !== "string" && !(bstr instanceof ArrayBuffer)) {
            throw new Error("Error al leer el archivo");
          }

          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const jsonData = XLSX.utils.sheet_to_json(ws, { defval: "" }) as Record<string, string>[];
          
          if (jsonData.length === 0) {
            throw new Error("El archivo no contiene datos para analizar");
          }

          // Verify required columns exist
          const hasRequiredColumns = "Motivo Pregunta 1" in jsonData[0] || 
                                   "encuesta de salida" in jsonData[0] ||
                                   "Encuesta de salida 4FRH-209" in jsonData[0];
          
          if (!hasRequiredColumns) {
            throw new Error("El archivo debe contener las columnas 'Motivo Pregunta 1', 'encuesta de salida' o 'Encuesta de salida 4FRH-209'");
          }

          console.log("Procesando datos:", {
            totalRows: jsonData.length,
            columns: Object.keys(jsonData[0]),
            sampleRow: jsonData[0]
          });

          setData(jsonData);
          const result = performAnalysis(jsonData);
          setAnalysisResult(result);
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        setError("Error al leer el archivo");
        setIsLoading(false);
      };

      reader.readAsBinaryString(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black p-8 font-sans">
      <h1 className="text-3xl font-bold mb-6 text-center">Análisis de Rotación</h1>
      
      <div className="max-w-2xl mx-auto mb-8 p-6 bg-gray-50 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Instrucciones</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Suba un archivo Excel (.xlsx o .xls)</li>
          <li>El archivo debe contener al menos una de estas columnas:
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>'Motivo Pregunta 1'</li>
              <li>'encuesta de salida'</li>
              <li>'Encuesta de salida 4FRH-209'</li>
            </ul>
          </li>
          <li>Para las encuestas de salida:
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>Se analizan respuestas numeradas (1., 2., 3., etc.)</li>
              <li>Cada respuesta numerada se procesa por separado</li>
              <li>Se agrupan respuestas por categorías semánticas:</li>
            </ul>
            <div className="grid grid-cols-2 gap-6 mt-4 ml-8 text-gray-600 bg-gray-50 p-4 rounded-lg">
              <div className="p-3 bg-white rounded-md shadow-sm">
                <p className="font-medium text-blue-700 mb-1">Compensación:</p>
                <p className="text-sm">sueldo, salario, pago, prestaciones, beneficios</p>
              </div>
              <div className="p-3 bg-white rounded-md shadow-sm">
                <p className="font-medium text-blue-700 mb-1">Horario:</p>
                <p className="text-sm">jornada, turnos, tiempo, schedule</p>
              </div>
              <div className="p-3 bg-white rounded-md shadow-sm">
                <p className="font-medium text-blue-700 mb-1">Ambiente:</p>
                <p className="text-sm">clima laboral, entorno, equipo, compañeros</p>
              </div>
              <div className="p-3 bg-white rounded-md shadow-sm">
                <p className="font-medium text-blue-700 mb-1">Desarrollo:</p>
                <p className="text-sm">capacitación, formación, crecimiento, carrera</p>
              </div>
              <div className="p-3 bg-white rounded-md shadow-sm">
                <p className="font-medium text-blue-700 mb-1">Cuidado de hijos:</p>
                <p className="text-sm">familia, guardería, maternal</p>
              </div>
              <div className="p-3 bg-white rounded-md shadow-sm">
                <p className="font-medium text-blue-700 mb-1">Transporte:</p>
                <p className="text-sm">traslado, distancia, ubicación</p>
              </div>
              <div className="p-3 bg-white rounded-md shadow-sm">
                <p className="font-medium text-blue-700 mb-1">Salud:</p>
                <p className="text-sm">enfermedad, médico, tratamiento</p>
              </div>
              <div className="p-3 bg-white rounded-md shadow-sm">
                <p className="font-medium text-blue-700 mb-1">Estudios:</p>
                <p className="text-sm">universidad, escuela, educación</p>
              </div>
              <div className="p-3 bg-white rounded-md shadow-sm">
                <p className="font-medium text-blue-700 mb-1">Mejor oferta:</p>
                <p className="text-sm">otra empresa, competencia, oportunidad</p>
              </div>
              <div className="p-3 bg-white rounded-md shadow-sm">
                <p className="font-medium text-blue-700 mb-1">Personal:</p>
                <p className="text-sm">mudanza, matrimonio, embarazo</p>
              </div>
            </div>
          </li>
          <li>Los datos serán analizados automáticamente al subir el archivo</li>
          <li>Las respuestas se analizan por pregunta y se muestra un análisis general</li>
          <li>Se destacan las categorías que representan más del 20% de las respuestas</li>
        </ul>
      </div>

      <div className="mb-6 text-center">
        <label className="inline-block">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isLoading}
          />
          <span className={`inline-flex items-center px-6 py-3 rounded-lg cursor-pointer
            ${isLoading ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'} 
            text-white font-medium transition-colors`}>
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando archivo...
              </>
            ) : (
              'Seleccionar archivo Excel'
            )}
          </span>
        </label>
      </div>

      {error && (
        <div className="max-w-2xl mx-auto mb-6">
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {analysisResult && <Dashboard analysis={analysisResult} />}
    </div>
  );
}
