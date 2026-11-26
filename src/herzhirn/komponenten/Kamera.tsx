import React from "react";

// Parallax-Kamera: jede Ebene bewegt sich je nach Tiefe unterschiedlich stark.
// tiefe 0 = Himmel/Hintergrund (bewegt sich kaum), 1 = Bildebene, >1 = Vordergrund.
export type Kam = { x: number; y: number; zoom: number; fx?: number; fy?: number; drehung?: number };

export const KamContext = React.createContext<Kam>({ x: 0, y: 0, zoom: 1 });

export const Kamera: React.FC<{ kam: Kam; children: React.ReactNode }> = ({ kam, children }) => (
  <KamContext.Provider value={kam}>{children}</KamContext.Provider>
);

export const Ebene: React.FC<{ tiefe: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ tiefe, children, style }) => {
  const k = React.useContext(KamContext);
  const fx = k.fx ?? 960;
  const fy = k.fy ?? 540;
  const z = 1 + (k.zoom - 1) * tiefe;
  const tx = -k.x * tiefe;
  const ty = -k.y * tiefe;
  const dr = (k.drehung ?? 0) * Math.min(1, tiefe);
  return (
    <g style={style} transform={`translate(${fx + tx} ${fy + ty}) rotate(${dr}) scale(${z}) translate(${-fx} ${-fy})`}>
      {children}
    </g>
  );
};
