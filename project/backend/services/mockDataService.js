import Emission from '../models/Emission.js';
import Maintenance from '../models/Maintenance.js';
import Load from '../models/Load.js';
import Ash from '../models/Ash.js';

export const generateMockData = async () => {
  try {
    // Generate emission data
    const emissionData = {
      sox: {
        value: Math.round(120 + Math.random() * 160), // 120-280 mg/Nm³
        threshold: 200
      },
      nox: {
        value: Math.round(180 + Math.random() * 200), // 180-380 mg/Nm³
        threshold: 300
      },
      co2: {
        value: Math.round(850 + Math.random() * 150), // 850-1000 kg/MWh
        threshold: 950
      },
      pm: {
        value: Math.round(15 + Math.random() * 25), // 15-40 mg/Nm³
        threshold: 30
      },
      co: {
        value: Math.round(40 + Math.random() * 80), // 40-120 mg/Nm³
        threshold: 100
      }
    };

    // Determine emission status
    const exceedsThreshold = Object.values(emissionData).some(param => param.value > param.threshold);
    emissionData.status = exceedsThreshold ? 'Critical' : 
                         Object.values(emissionData).some(param => param.value > param.threshold * 0.8) ? 'Warning' : 'Normal';

    await new Emission(emissionData).save();

    // Generate maintenance data
    const equipmentTypes = ['Boiler-1', 'Turbine-1', 'Generator-1', 'Condenser-1'];
    const equipment = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];

    const maintenanceData = {
      equipment: {
        id: `${equipment.toLowerCase().replace('-', '_')}_001`,
        name: equipment,
        type: equipment.split('-')[0],
        location: `Unit ${equipment.split('-')[1]}`
      },
      parameters: {
        temperature: Math.round(400 + Math.random() * 200), // 400-600°C
        vibration: Math.round((1 + Math.random() * 5) * 10) / 10, // 1-6 mm/s
        pressure: Math.round(120 + Math.random() * 80), // 120-200 bar
        efficiency: Math.round(85 + Math.random() * 12), // 85-97%
        runtime: Math.round(6000 + Math.random() * 2000) // 6000-8000 hours
      }
    };

    // Determine maintenance status
    const { temperature, vibration, pressure, efficiency } = maintenanceData.parameters;
    const tempCritical = temperature > 550;
    const vibrationCritical = vibration > 4.5;
    const pressureCritical = pressure > 180;
    const efficiencyLow = efficiency < 85;

    if (tempCritical || vibrationCritical || pressureCritical || efficiencyLow) {
      maintenanceData.status = 'Critical';
    } else if (temperature > 500 || vibration > 3.5 || pressure > 160 || efficiency < 90) {
      maintenanceData.status = 'Warning';
    } else {
      maintenanceData.status = 'Operational';
    }

    await new Maintenance(maintenanceData).save();

    // Generate load data
    const hour = new Date().getHours();
    const peakHours = [9, 10, 11, 18, 19, 20]; // Peak demand hours
    const isPeak = peakHours.includes(hour);
    
    const baseLoad = isPeak ? 1900 + Math.random() * 250 : 1400 + Math.random() * 400;
    
    const loadData = {
      demand: {
        current: Math.round(baseLoad),
        capacity: 2100
      },
      generation: {
        actual: Math.round(baseLoad - 50 + Math.random() * 100),
        scheduled: Math.round(baseLoad),
        efficiency: Math.round(88 + Math.random() * 8) // 88-96%
      },
      factors: {
        weather: {
          temperature: Math.round(25 + Math.random() * 15), // 25-40°C
          humidity: Math.round(40 + Math.random() * 40), // 40-80%
          condition: ['Clear', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 3)]
        },
        timeOfDay: hour,
        dayOfWeek: new Date().getDay(),
        season: ['Summer', 'Monsoon', 'Winter'][Math.floor(Math.random() * 3)],
        holidays: Math.random() > 0.9
      }
    };

    // Determine load status
    const loadPercentage = (loadData.demand.current / loadData.demand.capacity) * 100;
    loadData.status = loadPercentage > 95 ? 'Critical Load' :
                     loadPercentage > 85 ? 'High Demand' : 'Normal';

    await new Load(loadData).save();

    // Generate ash data
    const flyAshQuantity = Math.round(800 + Math.random() * 400); // Daily generation
    const bottomAshQuantity = Math.round(200 + Math.random() * 100);
    
    const ashData = {
      flyAsh: {
        quantity: flyAshQuantity,
        storage: {
          current: Math.round(25000 + Math.random() * 20000), // Current storage
          capacity: 50000
        },
        composition: {
          silica: Math.round(45 + Math.random() * 10), // 45-55%
          alumina: Math.round(20 + Math.random() * 8), // 20-28%
          iron: Math.round(3 + Math.random() * 4), // 3-7%
          lime: Math.round(1 + Math.random() * 3) // 1-4%
        }
      },
      bottomAsh: {
        quantity: bottomAshQuantity,
        storage: {
          current: Math.round(8000 + Math.random() * 5000), // Current storage
          capacity: 15000
        }
      },
      utilization: {
        cement: Math.round(flyAshQuantity * 0.4),
        bricks: Math.round(flyAshQuantity * 0.2),
        roads: Math.round(flyAshQuantity * 0.3),
        embankments: Math.round(bottomAshQuantity * 0.8),
        total: Math.round(flyAshQuantity * 0.9 + bottomAshQuantity * 0.8)
      },
      quality: {
        grade: ['Grade I', 'Grade II'][Math.floor(Math.random() * 2)],
        moisture: Math.round(Math.random() * 2), // 0-2%
        fineness: Math.round(320 + Math.random() * 80), // 320-400 m²/kg
        loi: Math.round(1 + Math.random() * 4) // 1-5%
      }
    };

    // Determine ash status
    const flyAshStorage = (ashData.flyAsh.storage.current / ashData.flyAsh.storage.capacity) * 100;
    const bottomAshStorage = (ashData.bottomAsh.storage.current / ashData.bottomAsh.storage.capacity) * 100;
    
    ashData.status = (flyAshStorage > 90 || bottomAshStorage > 90) ? 'Critical' :
                    (flyAshStorage > 75 || bottomAshStorage > 75) ? 'High Storage' : 'Normal';

    await new Ash(ashData).save();

    console.log('✅ Mock data generated successfully');
  } catch (error) {
    console.error('❌ Error generating mock data:', error);
  }
};