'use client';

import React, { useState } from 'react';
import { iconMap, iconNames } from './utils/iconMap';
import styles from './IconSelector.module.css';

type Props = {
  valor?: string;
  onChange: (icono: string) => void;
};

const IconSelector: React.FC<Props> = ({ valor, onChange }) => {
  const [abierto, setAbierto] = useState(false);

  const IconActual = valor && iconMap[valor as keyof typeof iconMap];

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className={styles.boton}
      >
        {IconActual ? <IconActual size={20} /> : 'Seleccionar icono'}
      </button>

      {abierto && (
        <div className={styles.popup}>
          {iconNames.map((nombre) => {
            const Icon = iconMap[nombre as keyof typeof iconMap];
            return (
              <div
                key={nombre}
                className={styles.icono}
                onClick={() => {
                  onChange(nombre);
                  setAbierto(false);
                }}
              >
                <Icon size={20} />
                <span>{nombre}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IconSelector;
