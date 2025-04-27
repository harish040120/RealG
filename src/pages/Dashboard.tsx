import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  Thermometer,
  Droplets,
  Wind,
  AlertTriangle,
  Sun,
  CloudRain,
  Cloud,
  Umbrella,
  Car,
  Sunset,
  CalendarClock,
  MapPin,
  Gauge,
  CloudSun,
  CloudLightning,
  Snowflake,
  Eye,
  Sunrise,
  Moon,
  Compass,
  ThermometerSun,
  ThermometerSnowflake,
  Waves,
  RefreshCw,
  HardHat,
  Construction
} from 'lucide-react';

// Types
type WeatherCondition = 'Sunny' | 'Partly Cloudy' | 'Cloudy' | 'Rain' | 'Thunderstorm' | 'Snow' | 'Fog';

interface WeatherData {
  time: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  rainfall: number;
  airQuality: number;
  uvIndex: number;
  pressure: number;
  visibility: number;
  condition: WeatherCondition;
}

interface ForecastData {
  date: string;
  highTemp: number;
  lowTemp: number;
  rainChance: number;
  windSpeed: number;
  condition: WeatherCondition;
  sunrise: string;
  sunset: string;
}

interface Alert {
  type: string;
  severity: 'info' | 'warning' | 'danger';
  message: string;
  icon: React.ComponentType<{ className?: string }>;
  timestamp: string;
  affectedZone?: string;
}

interface Suggestion {
  type: string;
  message: string;
  icon: React.ComponentType<{ className?: string }>;
  priority: 'low' | 'medium' | 'high';
}

interface CraneStatus {
  operation: 'normal' | 'limited' | 'suspended';
  message: string;
  maxLoadCapacity: number;
  maxHeight: number;
  recommendedActions: string[];
}

interface ConstructionInsight {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  impact: 'positive' | 'neutral' | 'negative';
}

// UI Components
const Switch = ({ checked, onCheckedChange, id }: { checked: boolean, onCheckedChange: (checked: boolean) => void, id?: string }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);

const Label = ({ htmlFor, children }: { htmlFor?: string, children: React.ReactNode }) => (
  <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
    {children}
  </label>
);

const Button = ({ variant = 'default', size = 'default', onClick, children, className = '' }: { 
  variant?: 'default' | 'outline', 
  size?: 'default' | 'sm',
  onClick?: () => void,
  children: React.ReactNode,
  className?: string
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500';
  const variantClasses = variant === 'outline' 
    ? 'border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700' 
    : 'bg-indigo-600 text-white hover:bg-indigo-700';
  const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm';
  
  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
    >
      {children}
    </button>
  );
};

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-md ${className}`} />
);

// Real-time weather API service
const fetchRealTimeWeather = async (lat: number, lon: number): Promise<WeatherData[]> => {
  try {
    // Using OpenWeatherMap API (you would need an API key in production)
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=YOUR_API_KEY&units=metric`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    
    const data = await response.json();
    
    // Process the data into our format
    const processedData: WeatherData[] = data.list.map((item: any) => {
      const date = new Date(item.dt * 1000);
      const hour = date.getHours();
      const hourString = `${hour.toString().padStart(2, '0')}:00`;
      
      // Determine weather condition
      let condition: WeatherCondition = 'Sunny';
      const weatherMain = item.weather[0].main.toLowerCase();
      if (weatherMain.includes('thunder')) condition = 'Thunderstorm';
      else if (weatherMain.includes('rain')) condition = 'Rain';
      else if (weatherMain.includes('snow')) condition = 'Snow';
      else if (weatherMain.includes('cloud')) condition = item.clouds.all > 50 ? 'Cloudy' : 'Partly Cloudy';
      else if (weatherMain.includes('fog') || weatherMain.includes('mist')) condition = 'Fog';
      
      return {
        time: hourString,
        temperature: item.main.temp,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed * 3.6, // Convert m/s to km/h
        windDirection: item.wind.deg,
        rainfall: item.rain ? item.rain['3h'] || 0 : 0,
        airQuality: 50 + Math.random() * 50, // Simulating AQI since OpenWeatherMap requires separate API call
        uvIndex: Math.round((item.clouds.all / 100) * 8), // Simple UV index simulation
        pressure: item.main.pressure,
        visibility: item.visibility / 1000, // Convert meters to km
        condition
      };
    });
    
    return processedData.slice(0, 24); // Return next 24 hours of data
  } catch (error) {
    console.error('Error fetching real-time weather:', error);
    // Fallback to mock data if API fails
    return fetchMockWeatherData(lat, lon);
  }
};

const fetchMockWeatherData = async (lat: number, lon: number): Promise<WeatherData[]> => {
  // This is a fallback function that generates realistic mock data based on location
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const now = new Date();
  const isUrban = Math.abs(lat - 40.7128) < 5 && Math.abs(lon - (-74.0060)) < 5; // Roughly near NYC
  const locationFactor = isUrban ? 1.2 : 0.9;
  
  const data: WeatherData[] = [];
  for (let i = 0; i < 24; i++) {
    const time = new Date(now);
    time.setHours(time.getHours() + i);
    const hour = time.getHours();
    const hourString = `${hour.toString().padStart(2, '0')}:00`;
    
    // Generate realistic weather patterns
    const baseTemp = 15 + 10 * Math.sin((hour - 6) * Math.PI / 12) * locationFactor;
    const tempVariation = (Math.random() - 0.5) * 3;
    const humidityBase = 50 + 20 * Math.sin((hour - 3) * Math.PI / 12);
    const humidityVariation = (Math.random() - 0.5) * 15;
    
    // Weather condition simulation
    let condition: WeatherCondition = 'Sunny';
    const rand = Math.random();
    if (rand > 0.95) condition = 'Thunderstorm';
    else if (rand > 0.85) condition = 'Rain';
    else if (rand > 0.75) condition = 'Snow'; // Added Snow
    else if (rand > 0.65) condition = 'Fog'; // Added Fog
    else if (rand > 0.5) condition = 'Cloudy';
    else if (rand > 0.3) condition = 'Partly Cloudy';
    // Sunny is the default
    
    data.push({
      time: hourString,
      temperature: parseFloat((baseTemp + tempVariation).toFixed(1)),
      humidity: Math.round(humidityBase + humidityVariation),
      windSpeed: parseFloat((5 + Math.random() * 10 + Math.sin(hour / 6 * Math.PI) * 5).toFixed(1)),
      windDirection: Math.round(Math.random() * 360),
      rainfall: condition === 'Rain' ? parseFloat((Math.random() * 5).toFixed(1)) : 
               condition === 'Thunderstorm' ? parseFloat((Math.random() * 10).toFixed(1)) : 0,
      airQuality: Math.round(50 + (Math.random() * 50) * (isUrban ? 1.3 : 1)),
      uvIndex: hour > 6 && hour < 20 ? Math.round(Math.abs(8 - Math.abs(12 - hour)) + Math.random() * 2) : 0,
      pressure: Math.round(1010 + (Math.random() - 0.5) * 15),
      visibility: condition === 'Fog' ? Math.round(Math.random() * 2) : 
                 condition === 'Rain' ? Math.round(5 + Math.random() * 5) : 
                 Math.round(8 + Math.random() * 12),
      condition
    });
  }
  
  return data;
};

const fetchForecast = async (lat: number, lon: number): Promise<ForecastData[]> => {
  try {
    // Using OpenWeatherMap API for forecast
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast/daily?lat=${lat}&lon=${lon}&cnt=7&appid=YOUR_API_KEY&units=metric`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch forecast data');
    }
    
    const data = await response.json();
    
    return data.list.map((day: any, index: number) => {
      const date = new Date();
      date.setDate(date.getDate() + index);
      const dateString = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
      // Determine weather condition
      let condition: WeatherCondition = 'Sunny';
      const weatherMain = day.weather[0].main.toLowerCase();
      if (weatherMain.includes('thunder')) condition = 'Thunderstorm';
      else if (weatherMain.includes('rain')) condition = 'Rain';
      else if (weatherMain.includes('snow')) condition = 'Snow';
      else if (weatherMain.includes('cloud')) condition = 'Cloudy';
      
      // Generate realistic sunrise/sunset times
      const sunriseHour = 6 + Math.round(Math.random() * 1.5);
      const sunsetHour = 18 + Math.round(Math.random() * 2);
      const sunrise = `${sunriseHour}:${Math.floor(Math.random() * 30 + 15).toString().padStart(2, '0')}`;
      const sunset = `${sunsetHour}:${Math.floor(Math.random() * 30 + 15).toString().padStart(2, '0')}`;
      
      return {
        date: dateString,
        highTemp: day.temp.max,
        lowTemp: day.temp.min,
        rainChance: Math.round(day.pop * 100),
        windSpeed: day.speed * 3.6, // Convert m/s to km/h
        condition,
        sunrise,
        sunset
      };
    });
  } catch (error) {
    console.error('Error fetching forecast:', error);
    // Fallback to mock forecast
    return fetchMockForecast();
  }
};

const fetchMockForecast = async (): Promise<ForecastData[]> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const forecasts: ForecastData[] = [];
  const now = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const dateString = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    
    // Generate forecast with realistic patterns
    const baseTemp = 22 + (Math.random() - 0.5) * 10;
    const willRain = Math.random() > (i < 2 ? 0.6 : 0.7);
    const isStorm = willRain && Math.random() > 0.7;
    
    // Generate realistic sunrise/sunset times
    const sunriseHour = 6 + Math.round(Math.random() * 1.5);
    const sunsetHour = 18 + Math.round(Math.random() * 2);
    const sunrise = `${sunriseHour}:${Math.floor(Math.random() * 30 + 15).toString().padStart(2, '0')}`;
    const sunset = `${sunsetHour}:${Math.floor(Math.random() * 30 + 15).toString().padStart(2, '0')}`;
    
    forecasts.push({
      date: dateString,
      highTemp: Math.round(baseTemp + 5 - (i * 0.5)),
      lowTemp: Math.round(baseTemp - 5 - (i * 0.3)),
      rainChance: willRain ? Math.round(Math.random() * 30 + (isStorm ? 40 : 20)) : Math.round(Math.random() * 15),
      windSpeed: Math.round(5 + Math.random() * 10 + (isStorm ? 5 : 0)),
      condition: isStorm ? 'Thunderstorm' : willRain ? 'Rain' : Math.random() > 0.5 ? 'Partly Cloudy' : 'Sunny',
      sunrise,
      sunset
    });
  }
  
  return forecasts;
};

const windDirectionToText = (degrees: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round((degrees % 360) / 45) % 8];
};

const getConditionIcon = (condition: WeatherCondition, size = 5): JSX.Element => {
  const className = `h-${size} w-${size}`;
  switch (condition) {
    case 'Sunny': return <Sun className={`${className} text-yellow-500`} />;
    case 'Partly Cloudy': return <CloudSun className={`${className} text-gray-400`} />;
    case 'Cloudy': return <Cloud className={`${className} text-gray-500`} />;
    case 'Rain': return <CloudRain className={`${className} text-blue-500`} />;
    case 'Thunderstorm': return <CloudLightning className={`${className} text-purple-500`} />;
    case 'Snow': return <Snowflake className={`${className} text-blue-300`} />;
    case 'Fog': return <Eye className={`${className} text-gray-300`} />;
    default: return <Sun className={`${className} text-yellow-500`} />;
  }
};

const getCraneStatus = (windSpeed: number): CraneStatus => {
  if (windSpeed > 40) {
    return {
      operation: 'suspended',
      message: 'All crane operations must be suspended immediately due to dangerous wind conditions',
      maxLoadCapacity: 0,
      maxHeight: 0,
      recommendedActions: [
        'Secure all crane booms and equipment',
        'Lower all loads to the ground',
        'Implement emergency shutdown procedures',
        'Evacuate crane operators from high elevations',
        'Monitor wind conditions continuously until safe'
      ]
    };
  } else if (windSpeed > 30) {
    return {
      operation: 'limited',
      message: 'Crane operations must be limited due to high winds',
      maxLoadCapacity: 50,
      maxHeight: 15,
      recommendedActions: [
        'Reduce load capacity to 50% of normal',
        'Limit boom height to 15 meters',
        'Increase safety margins for all lifts',
        'Use tag lines for all loads',
        'Avoid lifting large surface area loads',
        'Conduct additional safety briefings'
      ]
    };
  } else if (windSpeed > 20) {
    return {
      operation: 'limited',
      message: 'Exercise caution with crane operations due to strong winds',
      maxLoadCapacity: 70,
      maxHeight: 30,
      recommendedActions: [
        'Reduce load capacity to 70% of normal',
        'Limit boom height to 30 meters',
        'Use extra caution with light loads',
        'Secure all loose materials',
        'Consider postponing non-critical lifts'
      ]
    };
  } else {
    return {
      operation: 'normal',
      message: 'Normal crane operations permitted',
      maxLoadCapacity: 100,
      maxHeight: 100,
      recommendedActions: [
        'Maintain standard operating procedures',
        'Monitor wind conditions periodically',
        'Continue regular safety checks'
      ]
    };
  }
};

const getConstructionInsights = (
  currentData: WeatherData | null,
  forecast: ForecastData[],
  craneStatus: CraneStatus
): ConstructionInsight[] => {
  const insights: ConstructionInsight[] = [];
  
  if (!currentData) return insights;
  
  // Crane operation insight
  insights.push({
    title: 'Crane Operations',
    value: craneStatus.operation === 'normal' ? 'Normal' : 
           craneStatus.operation === 'limited' ? 'Limited' : 'Suspended',
    description: craneStatus.message,
    icon: HardHat,
    impact: craneStatus.operation === 'normal' ? 'positive' : 
            craneStatus.operation === 'limited' ? 'neutral' : 'negative'
  });
  
  // Optimal work hours insight
  const currentHour = new Date().getHours();
  const isDaytime = currentHour > 6 && currentHour < 20;
  const tempComfort = currentData.temperature > 10 && currentData.temperature < 30;
  const rainToday = forecast[0]?.rainChance > 50;
  
  insights.push({
    title: 'Optimal Work Hours',
    value: isDaytime && !rainToday && tempComfort ? 'Daytime' : 'Limited',
    description: isDaytime && !rainToday && tempComfort ? 
      'Current conditions are optimal for outdoor work' :
      rainToday ? 'Rain expected today - plan indoor work' :
      !isDaytime ? 'Nighttime - limited visibility' :
      'Temperature extremes may affect worker comfort',
    icon: Construction,
    impact: isDaytime && !rainToday && tempComfort ? 'positive' : 'neutral'
  });
  
  // Material storage insight
  const rainNext24h = forecast.slice(0, 2).some(day => day.rainChance > 60);
  
  insights.push({
    title: 'Material Storage',
    value: rainNext24h ? 'Cover Required' : 'Normal',
    description: rainNext24h ? 
      'High chance of rain in next 24 hours - cover all materials' :
      'No significant rain expected - normal storage conditions',
    icon: Umbrella,
    impact: rainNext24h ? 'neutral' : 'positive'
  });
  
  // Concrete pouring insight
  const tempRangeNext48h = forecast.slice(0, 2).reduce((acc, day) => {
    return {
      min: Math.min(acc.min, day.lowTemp),
      max: Math.max(acc.max, day.highTemp)
    };
  }, { min: Infinity, max: -Infinity });
  
  const goodPouringConditions = tempRangeNext48h.min > 5 && tempRangeNext48h.max < 32;
  
  insights.push({
    title: 'Concrete Pouring',
    value: goodPouringConditions ? 'Recommended' : 'Not Recommended',
    description: goodPouringConditions ?
      'Temperature range is ideal for concrete pouring (5°C to 32°C)' :
      `Temperature extremes expected (${tempRangeNext48h.min}°C to ${tempRangeNext48h.max}°C) - avoid pouring`,
    icon: Waves,
    impact: goodPouringConditions ? 'positive' : 'negative'
  });
  
  // Worker safety insight
  const uvRisk = currentData.uvIndex > 6;
  const heatRisk = currentData.temperature > 28;
  const coldRisk = currentData.temperature < 5;
  
  insights.push({
    title: 'Worker Safety',
    value: uvRisk || heatRisk || coldRisk ? 'High Risk' : 'Normal',
    description: uvRisk ? 'High UV index - require sun protection' :
               heatRisk ? 'High temperatures - hydration breaks needed' :
               coldRisk ? 'Low temperatures - cold weather gear required' :
               'Normal safety precautions sufficient',
    icon: AlertTriangle,
    impact: uvRisk || heatRisk || coldRisk ? 'negative' : 'positive'
  });
  
  return insights;
};

const Dashboard: React.FC = () => {
  const [sensorData, setSensorData] = useState<WeatherData[]>([]);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [useCelsius, setUseCelsius] = useState(true);
  const [selectedChart, setSelectedChart] = useState('temperature');
  const [expandedAlert, setExpandedAlert] = useState<number | null>(null);
  const [craneStatus, setCraneStatus] = useState<CraneStatus | null>(null);
  const [constructionInsights, setConstructionInsights] = useState<ConstructionInsight[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number, lon: number } | null>(null);
  const [locationName, setLocationName] = useState('Loading...');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get user's current location
      if (!userLocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        
        const { latitude: lat, longitude: lon } = position.coords;
        setUserLocation({ lat, lon });
        
        // Get location name (reverse geocoding)
        try {
          const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=YOUR_API_KEY`
          );
          const data = await response.json();
          if (data.length > 0) {
            setLocationName(`${data[0].name}, ${data[0].country}`);
          }
        } catch (error) {
          console.error('Error fetching location name:', error);
          setLocationName(`${lat.toFixed(4)}°, ${lon.toFixed(4)}°`);
        }
      }
      
      if (userLocation) {
        const [weatherData, forecast] = await Promise.all([
          fetchRealTimeWeather(userLocation.lat, userLocation.lon),
          fetchForecast(userLocation.lat, userLocation.lon)
        ]);

        setSensorData(weatherData);
        setForecastData(forecast);
        setLastUpdated(new Date().toLocaleTimeString());
        
        const currentData = weatherData[0];
        generateAlerts(currentData, forecast);
        
        // Update crane status based on current wind speed
        const currentWindSpeed = currentData.windSpeed;
        const status = getCraneStatus(currentWindSpeed);
        setCraneStatus(status);
        
        // Generate construction insights
        const insights = getConstructionInsights(currentData, forecast, status);
        setConstructionInsights(insights);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback to mock data at default location (New York)
      const fallbackLocation = { lat: 40.7128, lon: -74.0060 };
      setUserLocation(fallbackLocation);
      setLocationName('New York, US');
      
      const [weatherData, forecast] = await Promise.all([
        fetchMockWeatherData(fallbackLocation.lat, fallbackLocation.lon),
        fetchMockForecast()
      ]);
      
      setSensorData(weatherData);
      setForecastData(forecast);
      setLastUpdated(new Date().toLocaleTimeString());
      
      const currentData = weatherData[0];
      generateAlerts(currentData, forecast);
      
      const currentWindSpeed = currentData.windSpeed;
      const status = getCraneStatus(currentWindSpeed);
      setCraneStatus(status);
      
      const insights = getConstructionInsights(currentData, forecast, status);
      setConstructionInsights(insights);
    } finally {
      setIsLoading(false);
    }
  }, [userLocation]);

  useEffect(() => {
    loadData();

    // Set up refresh every 15 minutes
    const interval = setInterval(loadData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  const generateAlerts = (currentData: WeatherData, forecast: ForecastData[]) => {
    const newAlerts: Alert[] = [];
    const newSuggestions: Suggestion[] = [];
    const timestamp = new Date().toLocaleTimeString();

    // Temperature alerts
    if (currentData.temperature > 32) {
      newAlerts.push({
        type: 'Extreme Heat',
        severity: 'danger',
        message: `Extreme heat warning (${currentData.temperature}°C) - High risk of heat-related illnesses`,
        icon: ThermometerSun,
        timestamp,
        affectedZone: 'All areas'
      });
      newSuggestions.push({
        type: 'Work Advisory',
        message: 'Avoid all outdoor work during peak hours (11AM-3PM). Ensure hydration and frequent breaks.',
        icon: ThermometerSun,
        priority: 'high'
      });
    } else if (currentData.temperature > 28) {
      newAlerts.push({
        type: 'High Temperature',
        severity: 'warning',
        message: `High temperature warning (${currentData.temperature}°C) - Increased risk of heat stress`,
        icon: Thermometer,
        timestamp
      });
      newSuggestions.push({
        type: 'Work Suggestion',
        message: 'Limit outdoor work during midday. Schedule strenuous tasks for cooler morning/evening hours.',
        icon: Sun,
        priority: 'medium'
      });
    } else if (currentData.temperature < 0) {
      newAlerts.push({
        type: 'Freezing Conditions',
        severity: 'danger',
        message: `Freezing temperature warning (${currentData.temperature}°C) - Risk of frostbite and hypothermia`,
        icon: ThermometerSnowflake,
        timestamp,
        affectedZone: 'All areas'
      });
      newSuggestions.push({
        type: 'Safety Advisory',
        message: 'Wear appropriate cold-weather gear. Limit outdoor exposure to short periods.',
        icon: Snowflake,
        priority: 'high'
      });
    } else if (currentData.temperature < 5) {
      newAlerts.push({
        type: 'Cold Weather',
        severity: 'warning',
        message: `Cold temperature warning (${currentData.temperature}°C) - Increased risk of cold stress`,
        icon: ThermometerSnowflake,
        timestamp
      });
    }

    // Rainfall alerts
    if (currentData.rainfall > 10) {
      newAlerts.push({
        type: 'Heavy Rainfall',
        severity: 'danger',
        message: `Heavy rainfall warning (${currentData.rainfall}mm) - Potential flooding in low-lying areas`,
        icon: CloudRain,
        timestamp,
        affectedZone: 'Low-lying areas'
      });
      newSuggestions.push({
        type: 'Work Advisory',
        message: 'Postpone all non-essential outdoor work. Use extreme caution near waterways.',
        icon: Umbrella,
        priority: 'high'
      });
    } else if (currentData.rainfall > 5) {
      newAlerts.push({
        type: 'Moderate Rainfall',
        severity: 'warning',
        message: `Moderate rainfall (${currentData.rainfall}mm) - Slick surfaces and reduced visibility`,
        icon: CloudRain,
        timestamp
      });
      newSuggestions.push({
        type: 'Work Suggestion',
        message: 'Use rain gear and non-slip footwear. Increase visibility with high-vis clothing.',
        icon: Umbrella,
        priority: 'medium'
      });
    } else if (currentData.rainfall > 0) {
      newAlerts.push({
        type: 'Light Rainfall',
        severity: 'info',
        message: `Light rainfall (${currentData.rainfall}mm) - Slick surfaces possible`,
        icon: CloudRain,
        timestamp
      });
    }

    // Wind alerts
    if (currentData.windSpeed > 40) {
      newAlerts.push({
        type: 'Storm Force Winds',
        severity: 'danger',
        message: `Extreme wind warning (${currentData.windSpeed} km/h) - Danger from flying debris`,
        icon: Wind,
        timestamp,
        affectedZone: 'Exposed areas'
      });
      newSuggestions.push({
        type: 'Safety Advisory',
        message: 'All outdoor work should be suspended. Seek shelter immediately.',
        icon: AlertTriangle,
        priority: 'high'
      });
    } else if (currentData.windSpeed > 30) {
      newAlerts.push({
        type: 'Gale Force Winds',
        severity: 'warning',
        message: `High wind warning (${currentData.windSpeed} km/h) - Difficult working conditions`,
        icon: Wind,
        timestamp
      });
      newSuggestions.push({
        type: 'Work Advisory',
        message: 'Secure all loose materials. Use extra caution with equipment and scaffolding.',
        icon: Wind,
        priority: 'high'
      });
    } else if (currentData.windSpeed > 20) {
      newAlerts.push({
        type: 'Strong Winds',
        severity: 'info',
        message: `Strong winds (${currentData.windSpeed} km/h) - Use caution with light materials`,
        icon: Wind,
        timestamp
      });
    }

    // UV index alerts
    if (currentData.uvIndex > 8) {
      newAlerts.push({
        type: 'Extreme UV Index',
        severity: 'danger',
        message: `Extreme UV radiation (Index ${currentData.uvIndex}) - Very high risk of harm`,
        icon: Sun,
        timestamp
      });
      newSuggestions.push({
        type: 'Health Advisory',
        message: 'Apply SPF 50+ sunscreen every 2 hours. Wear UV-protective clothing and sunglasses.',
        icon: Sun,
        priority: 'high'
      });
    } else if (currentData.uvIndex > 6) {
      newAlerts.push({
        type: 'High UV Index',
        severity: 'warning',
        message: `High UV radiation (Index ${currentData.uvIndex}) - Increased risk of sunburn`,
        icon: Sun,
        timestamp
      });
    }

    // Air quality alerts
    if (currentData.airQuality < 30) {
      newAlerts.push({
        type: 'Hazardous Air Quality',
        severity: 'danger',
        message: `Dangerous air quality (${currentData.airQuality}) - Health warnings for everyone`,
        icon: AlertTriangle,
        timestamp,
        affectedZone: 'Construction site'
      });
      newSuggestions.push({
        type: 'Health Advisory',
        message: 'Avoid all outdoor exertion. Sensitive groups should remain indoors.',
        icon: AlertTriangle,
        priority: 'high'
      });
    } else if (currentData.airQuality < 50) {
      newAlerts.push({
        type: 'Poor Air Quality',
        severity: 'warning',
        message: `Poor air quality (${currentData.airQuality}) - Sensitive groups affected`,
        icon: AlertTriangle,
        timestamp
      });
    }

    // Visibility alerts
    if (currentData.visibility < 1000) {
      newAlerts.push({
        type: 'Low Visibility',
        severity: 'warning',
        message: `Reduced visibility (${currentData.visibility / 1000} km) - Use caution when driving`,
        icon: Eye,
        timestamp
      });
    }

    // Check upcoming forecast for significant changes
    if (forecast[0]?.rainChance > 70) {
      newSuggestions.push({
        type: 'Weather Forecast',
        message: `Very high chance of rain (${forecast[0].rainChance}%) expected today. Reschedule outdoor work if possible.`,
        icon: CloudRain,
        priority: 'medium'
      });
    } else if (forecast[0]?.rainChance > 50) {
      newSuggestions.push({
        type: 'Weather Forecast',
        message: `High chance of rain (${forecast[0].rainChance}%) expected today. Plan accordingly.`,
        icon: CloudRain,
        priority: 'low'
      });
    }

    // Temperature swing advisory
    if (Math.abs(forecast[0]?.highTemp - currentData.temperature) > 10) {
      newSuggestions.push({
        type: 'Temperature Change',
        message: `Significant temperature change expected (${forecast[0].highTemp}°C). Dress appropriately.`,
        icon: Thermometer,
        priority: 'low'
      });
    }

    setAlerts(newAlerts);
    setSuggestions(newSuggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }));
  };

  const toggleTemperatureUnit = () => {
    setUseCelsius(!useCelsius);
  };

  const convertTemp = (temp: number): number => {
    return useCelsius ? temp : parseFloat((temp * 9 / 5 + 32).toFixed(1));
  };

  const getWindRoseData = () => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions.map(direction => {
      const relevantData = sensorData.filter(data => 
        windDirectionToText(data.windDirection) === direction
      );
      const avgSpeed = relevantData.length > 0 ?
        relevantData.reduce((sum, data) => sum + data.windSpeed, 0) / relevantData.length :
        0;
      return {
        direction,
        speed: parseFloat(avgSpeed.toFixed(1))
      };
    });
  };

  const getAqiCategory = (value: number): string => {
    if (value >= 0 && value <= 50) return 'Good';
    if (value <= 100) return 'Moderate';
    if (value <= 150) return 'Unhealthy for Sensitive Groups';
    if (value <= 200) return 'Unhealthy';
    if (value <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const getAqiColor = (value: number): string => {
    if (value >= 0 && value <= 50) return 'bg-green-500';
    if (value <= 100) return 'bg-yellow-500';
    if (value <= 150) return 'bg-orange-500';
    if (value <= 200) return 'bg-red-500';
    if (value <= 300) return 'bg-purple-500';
    return 'bg-maroon-500';
  };

  const currentConditions = sensorData.length > 0 ? sensorData[0] : null;
  const windRoseData = getWindRoseData();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-40" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-64 w-full" />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Construction Weather Dashboard</h1>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            <span>Location: {locationName}</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="temperature-unit"
              checked={!useCelsius}
              onCheckedChange={toggleTemperatureUnit}
            />
            <Label htmlFor="temperature-unit">
              {useCelsius ? '°C' : '°F'}
            </Label>
          </div>
          
          <div className="text-sm text-gray-500 flex items-center">
            <CalendarClock className="h-4 w-4 mr-1" />
            Last updated: {lastUpdated}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Construction Insights */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Construction Site Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {constructionInsights.map((insight, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg border-l-4 ${
                insight.impact === 'positive' ? 'border-green-500 bg-green-50' :
                insight.impact === 'negative' ? 'border-red-500 bg-red-50' :
                'border-amber-500 bg-amber-50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${
                  insight.impact === 'positive' ? 'bg-green-100 text-green-600' :
                  insight.impact === 'negative' ? 'bg-red-100 text-red-600' :
                  'bg-amber-100 text-amber-600'
                }`}>
                  <insight.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">{insight.title}</h3>
                  <p className={`text-sm font-bold ${
                    insight.impact === 'positive' ? 'text-green-700' :
                    insight.impact === 'negative' ? 'text-red-700' :
                    'text-amber-700'
                  }`}>
                    {insight.value}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Conditions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Temperature Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Thermometer className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Temperature</span>
            </div>
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
              {currentConditions?.condition}
            </span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold">
              {currentConditions ? convertTemp(currentConditions.temperature) : '--'}{useCelsius ? '°C' : '°F'}
            </h3>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                Feels like {currentConditions ? convertTemp(currentConditions.temperature + (currentConditions.windSpeed / 10)) : '--'}{useCelsius ? '°C' : '°F'}
              </p>
              <p className="text-xs text-gray-500">
                {forecastData[0]?.highTemp ? `High: ${convertTemp(forecastData[0].highTemp)}${useCelsius ? '°C' : '°F'}` : ''}
              </p>
            </div>
          </div>
          <div className="mt-4 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sensorData.slice(0, 6)}>
                <Area
                  type="monotone"
                  dataKey="temperature"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Humidity Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Droplets className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Humidity</span>
            </div>
            <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded">
              Dew {currentConditions ? Math.round(currentConditions.temperature - ((100 - currentConditions.humidity)/5)) : '--'}°C
            </span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold">
              {currentConditions?.humidity || '--'}%
            </h3>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                {currentConditions?.pressure || '--'} hPa
              </p>
              <p className="text-xs text-gray-500">
                {forecastData[0]?.rainChance ? `Rain: ${forecastData[0].rainChance}%` : ''}
              </p>
            </div>
          </div>
          <div className="mt-4 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sensorData.slice(0, 6)}>
                <Area
                  type="monotone"
                  dataKey="humidity"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wind Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Wind className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Wind</span>
            </div>
            <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded">
              {currentConditions ? windDirectionToText(currentConditions.windDirection) : '--'}
            </span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold">
              {currentConditions?.windSpeed || '--'} km/h
            </h3>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                Gusts {currentConditions ? (currentConditions.windSpeed + 5).toFixed(1) : '--'} km/h
              </p>
              <p className="text-xs text-gray-500">
                {forecastData[0]?.windSpeed ? `Forecast: ${forecastData[0].windSpeed} km/h` : ''}
              </p>
            </div>
          </div>
          <div className="mt-4 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sensorData.slice(0, 6)}>
                <Area
                  type="monotone"
                  dataKey="windSpeed"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Air Quality Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Gauge className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Air Quality</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${currentConditions ? getAqiColor(currentConditions.airQuality) : 'bg-gray-100'} text-white`}>
              {currentConditions ? getAqiCategory(currentConditions.airQuality) : '--'}
            </span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold">
              {currentConditions?.airQuality || '--'}
            </h3>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                Visibility {currentConditions ? (currentConditions.visibility / 1000).toFixed(1) : '--'} km
              </p>
              <p className="text-xs text-gray-500">
                UV Index {currentConditions?.uvIndex || '--'}
              </p>
            </div>
          </div>
          <div className="mt-4 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sensorData.slice(0, 6)}>
                <Area
                  type="monotone"
                  dataKey="airQuality"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Detailed Weather Metrics</h2>
            <select
              value={selectedChart}
              onChange={(e) => setSelectedChart(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
            >
              <option value="temperature">Temperature</option>
              <option value="humidity">Humidity</option>
              <option value="windSpeed">Wind Speed</option>
              <option value="rainfall">Rainfall</option>
              <option value="airQuality">Air Quality</option>
              <option value="pressure">Pressure</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={selectedChart}
                  stroke={
                    selectedChart === 'temperature' ? '#3B82F6' :
                    selectedChart === 'humidity' ? '#10B981' :
                    selectedChart === 'windSpeed' ? '#8B5CF6' :
                    selectedChart === 'rainfall' ? '#06B6D4' :
                    selectedChart === 'airQuality' ? '#F59E0B' :
                    '#EC4899'
                  }
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                  name={
                    selectedChart === 'temperature' ? 'Temperature (°C)' :
                    selectedChart === 'humidity' ? 'Humidity (%)' :
                    selectedChart === 'windSpeed' ? 'Wind Speed (km/h)' :
                    selectedChart === 'rainfall' ? 'Rainfall (mm)' :
                    selectedChart === 'airQuality' ? 'Air Quality' :
                    'Pressure (hPa)'
                  }
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wind Rose Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Wind Direction & Speed</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius={120} data={windRoseData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="direction" />
                <PolarRadiusAxis angle={30} domain={[0, 'dataMax + 5']} />
                <Radar
                  name="Wind Speed"
                  dataKey="speed"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={0.3}
                />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-sm text-gray-500 text-center">
            {currentConditions && (
              <p>Current wind: {currentConditions.windSpeed} km/h from {windDirectionToText(currentConditions.windDirection)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Crane Operations Section */}
      {craneStatus && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Crane Operations Status</h2>
          <div className={`p-4 rounded-lg ${
            craneStatus.operation === 'suspended' ? 'bg-red-50 border-red-500' :
            craneStatus.operation === 'limited' ? 'bg-amber-50 border-amber-500' :
            'bg-green-50 border-green-500'
          } border-l-4`}>
            <div className="flex items-start space-x-3">
              <AlertTriangle className={`h-6 w-6 ${
                craneStatus.operation === 'suspended' ? 'text-red-500' :
                craneStatus.operation === 'limited' ? 'text-amber-500' :
                'text-green-500'
              }`} />
              <div>
                <h3 className={`text-lg font-bold ${
                  craneStatus.operation === 'suspended' ? 'text-red-800' :
                  craneStatus.operation === 'limited' ? 'text-amber-800' :
                  'text-green-800'
                }`}>
                  {craneStatus.operation === 'suspended' ? 'Operations Suspended' :
                   craneStatus.operation === 'limited' ? 'Operations Limited' :
                   'Normal Operations'}
                </h3>
                <p className="text-gray-700">{craneStatus.message}</p>
               <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg shadow-xs">
                    <h4 className="font-medium text-gray-700 mb-2">Operational Limits</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Load Capacity:</span>
                        <span className="font-medium">{craneStatus.maxLoadCapacity}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Boom Height:</span>
                        <span className="font-medium">{craneStatus.maxHeight}m</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-xs">
                    <h4 className="font-medium text-gray-700 mb-2">Current Wind Conditions</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Wind Speed:</span>
                        <span className="font-medium">{currentConditions?.windSpeed || '--'} km/h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Direction:</span>
                        <span className="font-medium">
                          {currentConditions ? windDirectionToText(currentConditions.windDirection) : '--'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gusts:</span>
                        <span className="font-medium">
                          {currentConditions ? (currentConditions.windSpeed + 5).toFixed(1) : '--'} km/h
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
               <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Recommended Actions</h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    {craneStatus.recommendedActions.map((action, i) => (
                      <li key={i}>{action}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weather Conditions Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Weather Conditions</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Sunny', value: sensorData.filter(d => d.condition === 'Sunny').length },
                    { name: 'Partly Cloudy', value: sensorData.filter(d => d.condition === 'Partly Cloudy').length },
                    { name: 'Cloudy', value: sensorData.filter(d => d.condition === 'Cloudy').length },
                    { name: 'Rain', value: sensorData.filter(d => d.condition === 'Rain').length },
                    { name: 'Thunderstorm', value: sensorData.filter(d => d.condition === 'Thunderstorm').length }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#FBBF24" />
                  <Cell fill="#A1A1AA" />
                  <Cell fill="#71717A" />
                  <Cell fill="#60A5FA" />
                  <Cell fill="#A78BFA" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pressure Trend */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Pressure Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sensorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" />
                <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="pressure"
                  stroke="#EC4899"
                  fill="#EC4899"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {currentConditions && (
              <p>Current pressure: {currentConditions.pressure} hPa {
                sensorData.length > 1 ? 
                  (currentConditions.pressure > sensorData[1].pressure ? 
                    '(Rising)' : '(Falling)') : ''
              }</p>
            )}
          </div>
        </div>
      </div>

      {/* Forecast Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">7-Day Forecast</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4">
          {forecastData.map((day, index) => (
            <div key={index} className="text-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <p className="font-medium text-gray-700">{day.date.split(',')[0]}</p>
              <p className="text-xs text-gray-500">{day.date.split(',')[1]}</p>
              <div className="my-2 flex justify-center">
                {getConditionIcon(day.condition, 6)}
              </div>
              <p className="text-sm text-gray-600 capitalize">{day.condition.toLowerCase()}</p>
              <div className="flex justify-center gap-4 mt-2">
                <span className="font-bold text-gray-800">{convertTemp(day.highTemp)}{useCelsius ? '°' : '°F'}</span>
                <span className="text-gray-500">{convertTemp(day.lowTemp)}{useCelsius ? '°' : '°F'}</span>
              </div>
              <div className="mt-2 flex flex-col gap-1 text-xs">
                <div className="flex items-center justify-center text-blue-600">
                  <Droplets className="h-3 w-3 mr-1" />
                  {day.rainChance}%
                </div>
                <div className="flex items-center justify-center text-gray-600">
                  <Wind className="h-3 w-3 mr-1" />
                  {day.windSpeed} km/h
                </div>
                <div className="flex items-center justify-center text-amber-500">
                  <Sunrise className="h-3 w-3 mr-1" />
                  {day.sunrise}
                </div>
                <div className="flex items-center justify-center text-indigo-500">
                  <Sunset className="h-3 w-3 mr-1" />
                  {day.sunset}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts & Suggestions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Active Alerts ({alerts.length})</h2>
            <div className="flex gap-2">
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                {alerts.filter(a => a.severity === 'danger').length} Critical
              </span>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                {alerts.filter(a => a.severity === 'warning').length} Warnings
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {alerts.length > 0 ? (
              alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`border-l-4 p-4 rounded cursor-pointer transition-all ${
                    alert.severity === 'danger'
                      ? 'bg-red-50 border-red-500 hover:bg-red-100'
                      : alert.severity === 'warning'
                        ? 'bg-amber-50 border-amber-500 hover:bg-amber-100'
                        : 'bg-blue-50 border-blue-500 hover:bg-blue-100'
                  }`}
                  onClick={() => setExpandedAlert(expandedAlert === index ? null : index)}
                >
                  <div className="flex items-start space-x-3">
                    <alert.icon className={`h-5 w-5 ${
                      alert.severity === 'danger'
                        ? 'text-red-500'
                        : alert.severity === 'warning'
                          ? 'text-amber-500'
                          : 'text-blue-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className={`font-medium ${
                          alert.severity === 'danger'
                            ? 'text-red-800'
                            : alert.severity === 'warning'
                              ? 'text-amber-800'
                              : 'text-blue-800'
                        }`}>
                          {alert.type}
                        </p>
                        <span className="text-xs text-gray-500">{alert.timestamp}</span>
                      </div>
                      <p className={`text-sm ${
                        alert.severity === 'danger'
                          ? 'text-red-600'
                          : alert.severity === 'warning'
                            ? 'text-amber-600'
                            : 'text-blue-600'
                      }`}>
                        {alert.message}
                      </p>
                      {expandedAlert === index && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          {alert.affectedZone && (
                            <p className="text-xs text-gray-600">
                              <span className="font-medium">Affected Area:</span> {alert.affectedZone}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Last updated: {alert.timestamp}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No active weather alerts</p>
                <p className="text-sm mt-1">All systems normal</p>
              </div>
            )}
          </div>
        </div>

        {/* Work Suggestions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Work & Safety Recommendations</h2>
          <div className="space-y-3">
            {suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`bg-gray-50 border-l-4 p-4 rounded hover:bg-gray-100 transition-colors ${
                    suggestion.priority === 'high' ? 'border-red-400' :
                    suggestion.priority === 'medium' ? 'border-amber-400' :
                    'border-gray-400'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-1 rounded ${
                      suggestion.priority === 'high' ? 'bg-red-100 text-red-600' :
                      suggestion.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <suggestion.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-gray-800">{suggestion.type}</p>
                        {suggestion.priority === 'high' && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">High Priority</span>
                        )}
                        {suggestion.priority === 'medium' && (
                          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Medium Priority</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{suggestion.message}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No specific work recommendations at this time</p>
                <p className="text-sm mt-1">Conditions are generally favorable for outdoor work</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sunrise/Sunset Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Daylight Information</h2>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <Sunrise className="h-10 w-10 text-amber-400" />
              <div>
                <p className="text-sm text-gray-600">Today's Sunrise</p>
                <h3 className="text-2xl font-bold">{forecastData[0]?.sunrise || '--:--'}</h3>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Sunset className="h-10 w-10 text-indigo-500" />
              <div>
                <p className="text-sm text-gray-600">Today's Sunset</p>
                <h3 className="text-2xl font-bold">{forecastData[0]?.sunset || '--:--'}</h3>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="relative h-2 bg-gradient-to-r from-amber-400 via-yellow-200 to-indigo-500 rounded-full">
              <div
                className="absolute top-0 h-2 bg-gray-800 rounded-full"
                style={{
                  left: `${((new Date().getHours() + new Date().getMinutes() / 60) / 24) * 100}%`,
                  width: '2px'
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Midnight</span>
              <span>Noon</span>
              <span>Midnight</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center text-sm">
            <Moon className="h-4 w-4 mr-1 text-gray-600" />
            <span className="text-gray-600">
              {new Date().getHours() >= 6 && new Date().getHours() < 18 ? (
                `Daytime - ${Math.max(0, 18 - new Date().getHours())}h ${Math.max(0, 60 - new Date().getMinutes())}m until sunset`
              ) : (
                `Nighttime - ${Math.max(0, 6 - new Date().getHours() + 24) % 24}h ${Math.max(0, 60 - new Date().getMinutes())}m until sunrise`
              )}
            </span>
          </div>
        </div>

        {/* Wind Compass */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Wind Direction</h2>
          <div className="flex flex-col items-center justify-center h-full">
            {currentConditions ? (
              <>
                <div className="relative w-40 h-40 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-200 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-gray-50 flex items-center justify-center">
                      <Compass className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                  <div
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-l-8 border-r-8 border-b-16 border-l-transparent border-r-transparent border-b-blue-500"
                    style={{ transform: `translate(-50%, -50%) rotate(${currentConditions.windDirection}deg)` }}
                  ></div>
                  <div className="absolute top-2 left-2 text-xs font-medium">N</div>
                  <div className="absolute top-2 right-2 text-xs font-medium">E</div>
                  <div className="absolute bottom-2 left-2 text-xs font-medium">W</div>
                  <div className="absolute bottom-2 right-2 text-xs font-medium">S</div>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">
                    {windDirectionToText(currentConditions.windDirection)} ({currentConditions.windDirection}°)
                  </p>
                  <p className="text-gray-600">
                    {currentConditions.windSpeed} km/h
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Gusting to {(currentConditions.windSpeed + 5).toFixed(1)} km/h
                  </p>
                </div>
              </>
            ) : (
              <p className="text-gray-500">No wind data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Historical Data */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Historical Weather Trends</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2">Temperature Extremes</h3>
            <div className="flex justify-between">
              <div className="text-center">
                <p className="text-sm text-gray-500">Today's High</p>
                <p className="text-xl font-bold text-red-500">
                  {Math.max(...sensorData.map(d => d.temperature)).toFixed(1)}°C
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Today's Low</p>
                <p className="text-xl font-bold text-blue-500">
                  {Math.min(...sensorData.map(d => d.temperature)).toFixed(1)}°C
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2">Rainfall Total</h3>
            <div className="text-center">
              <p className="text-sm text-gray-500">Last 24 Hours</p>
              <p className="text-xl font-bold text-blue-600">
                {sensorData.reduce((sum, d) => sum + d.rainfall, 0).toFixed(1)} mm
              </p>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2">Wind Peak</h3>
            <div className="text-center">
              <p className="text-sm text-gray-500">Maximum Gust</p>
              <p className="text-xl font-bold text-purple-600">
                {Math.max(...sensorData.map(d => d.windSpeed + 5)).toFixed(1)} km/h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Construction Site Planning */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Construction Site Planning</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center space-x-3">
              <HardHat className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-medium text-gray-800">Optimal Work Window</h3>
                <p className="text-sm text-gray-600">
                  {currentConditions && currentConditions.temperature > 5 && currentConditions.temperature < 30 
                    ? `${forecastData[0]?.sunrise} to ${forecastData[0]?.sunset}`
                    : 'Limited due to temperature extremes'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
            <div className="flex items-center space-x-3">
              <Construction className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-medium text-gray-800">Concrete Pouring</h3>
                <p className="text-sm text-gray-600">
                  {forecastData.slice(0, 2).every(day => day.lowTemp > 5 && day.highTemp < 32)
                    ? 'Recommended next 48 hours'
                    : 'Not recommended - temperature extremes'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
            <div className="flex items-center space-x-3">
              <Umbrella className="h-6 w-6 text-amber-600" />
              <div>
                <h3 className="font-medium text-gray-800">Material Protection</h3>
                <p className="text-sm text-gray-600">
                  {forecastData.some(day => day.rainChance > 50)
                    ? 'Cover materials - rain expected'
                    : 'No rain expected - normal storage'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
            <div className="flex items-center space-x-3">
              <Thermometer className="h-6 w-6 text-purple-600" />
              <div>
                <h3 className="font-medium text-gray-800">Worker Safety</h3>
                <p className="text-sm text-gray-600">
                  {currentConditions && currentConditions.temperature > 28
                    ? 'Heat stress risk - hydration breaks needed'
                    : currentConditions && currentConditions.temperature < 5
                      ? 'Cold stress risk - warm gear required'
                      : 'Normal conditions - standard precautions'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;