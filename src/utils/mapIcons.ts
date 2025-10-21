import { Icon, DivIcon } from 'leaflet';

// Fix for default markers in React-Leaflet v4
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://i.postimg.cc/MTNGffDN/map1-1.png',
  iconUrl: 'https://i.postimg.cc/8cvzRkX5/map2-1.png',
  shadowUrl: '',
});

// Create custom icons for tour start and end
export const createTourStartIcon = () => new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: '',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const createTourEndIcon = () => new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: '',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Create numbered marker icons
export const createNumberedIcon = (number: number, isStart: boolean = false, isEnd: boolean = false) => {
  let backgroundColor = '#272727'; // Default blue
  let textColor = 'white';
  
  if (isStart) {
    backgroundColor = '#16a34a'; // Green for start
  } else if (isEnd) {
    backgroundColor = '#dc2626'; // Red for end
  }
  
  return new DivIcon({
    html: `
      <div style="
        background-color: ${backgroundColor};
        color: ${textColor};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        font-family: Arial, sans-serif;
      ">${number}</div>
    `,
    className: 'numbered-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};
