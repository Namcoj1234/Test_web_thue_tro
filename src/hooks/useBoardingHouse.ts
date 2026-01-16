import { useState, useEffect } from 'react';
import { Room, BillCalculation } from '@/types';

const STORAGE_KEY = 'boarding-house-data';

const INITIAL_ROOMS: Room[] = [
    { id: 1, name: 'Phòng 1', occupants: 0, electricityOld: 0, electricityNew: 0 },
    { id: 2, name: 'Phòng 2', occupants: 0, electricityOld: 0, electricityNew: 0 },
    { id: 3, name: 'Phòng 3', occupants: 0, electricityOld: 0, electricityNew: 0 },
    { id: 4, name: 'Phòng 4', occupants: 0, electricityOld: 0, electricityNew: 0 },
];

export function useBoardingHouse() {
    const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setRooms(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse rooms', e);
            }
        }
    }, []);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
        }
    }, [rooms, mounted]);

    const updateRoom = (id: number, data: Partial<Room>) => {
        setRooms(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    };

    const calculateBill = (room: Room): BillCalculation => {
        const electricityUsage = Math.max(0, room.electricityNew - room.electricityOld);
        const electricityCost = electricityUsage * 5000;

        // Total for the room
        const waterCost = room.occupants * 80000;
        const roomRent = room.occupants * 1000000;

        const totalBill = roomRent + waterCost + electricityCost;

        let perPerson = 0;
        if (room.occupants > 0) {
            // Formula: (Rent + Water) + (Electricity / People)
            perPerson = (1000000 + 80000) + (electricityCost / room.occupants);
        }

        return {
            electricityUsage,
            electricityCost,
            waterCost,
            roomRent,
            totalBill,
            perPerson
        };
    };

    return { rooms, updateRoom, calculateBill, mounted };
}
