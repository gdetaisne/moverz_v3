"use client";
import React from 'react';
import { RoomGroup } from '@/lib/roomValidation';
import { RoomInventoryCard } from './RoomInventoryCard';

interface Step2RoomInventoryProps {
  roomGroups: RoomGroup[];
  onRoomTypeChange: (groupId: string, newRoomType: string) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function Step2RoomInventory({ 
  roomGroups, 
  onRoomTypeChange, 
  onPrevious, 
  onNext 
}: Step2RoomInventoryProps) {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            📋 Étape 2 : Inventaire par Pièce
          </h2>
          
          <div className="space-y-8">
            {roomGroups.length > 0 ? (
              roomGroups.map((roomGroup) => (
                <RoomInventoryCard
                  key={roomGroup.id}
                  roomGroup={roomGroup}
                  onRoomTypeChange={(newRoomType) => onRoomTypeChange(roomGroup.id, newRoomType)}
                />
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="text-xl font-medium mb-2">Aucune pièce validée</h3>
                <p>Veuillez d'abord valider les pièces à l'étape précédente</p>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={onPrevious}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Précédent
            </button>
            
            <button
              onClick={onNext}
              disabled={roomGroups.length === 0}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuer vers le devis
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
