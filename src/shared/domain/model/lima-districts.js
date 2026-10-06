/**
 * Reference catalog of Metropolitan Lima and Callao districts with their approximate centroid coordinates.
 * It is part of the Shared Kernel and is used to validate addresses and to estimate distances.
 *
 * @type {Readonly<Record<string, {latitude: number, longitude: number}>>}
 */
export const LimaDistricts = Object.freeze({
    'Ate':                      Object.freeze({ latitude: -12.0256, longitude: -76.9180 }),
    'Barranco':                 Object.freeze({ latitude: -12.1490, longitude: -77.0210 }),
    'Bellavista':               Object.freeze({ latitude: -12.0600, longitude: -77.1100 }),
    'Breña':                    Object.freeze({ latitude: -12.0600, longitude: -77.0500 }),
    'Callao':                   Object.freeze({ latitude: -12.0566, longitude: -77.1181 }),
    'Carabayllo':               Object.freeze({ latitude: -11.8500, longitude: -77.0300 }),
    'Chorrillos':               Object.freeze({ latitude: -12.1700, longitude: -77.0200 }),
    'Chosica':                  Object.freeze({ latitude: -11.9400, longitude: -76.7000 }),
    'Comas':                    Object.freeze({ latitude: -11.9333, longitude: -77.0500 }),
    'El Agustino':              Object.freeze({ latitude: -12.0450, longitude: -76.9950 }),
    'Independencia':            Object.freeze({ latitude: -11.9900, longitude: -77.0500 }),
    'Jesús María':              Object.freeze({ latitude: -12.0770, longitude: -77.0490 }),
    'La Molina':                Object.freeze({ latitude: -12.0800, longitude: -76.9300 }),
    'La Victoria':              Object.freeze({ latitude: -12.0700, longitude: -77.0170 }),
    'Lima':                     Object.freeze({ latitude: -12.0464, longitude: -77.0428 }),
    'Lince':                    Object.freeze({ latitude: -12.0850, longitude: -77.0360 }),
    'Los Olivos':               Object.freeze({ latitude: -11.9700, longitude: -77.0700 }),
    'Lurín':                    Object.freeze({ latitude: -12.2747, longitude: -76.8706 }),
    'Magdalena del Mar':        Object.freeze({ latitude: -12.0910, longitude: -77.0700 }),
    'Miraflores':               Object.freeze({ latitude: -12.1211, longitude: -77.0297 }),
    'Pachacámac':               Object.freeze({ latitude: -12.2300, longitude: -76.8600 }),
    'Pueblo Libre':             Object.freeze({ latitude: -12.0750, longitude: -77.0630 }),
    'Puente Piedra':            Object.freeze({ latitude: -11.8650, longitude: -77.0750 }),
    'Rímac':                    Object.freeze({ latitude: -12.0300, longitude: -77.0300 }),
    'San Borja':                Object.freeze({ latitude: -12.1000, longitude: -77.0000 }),
    'San Isidro':               Object.freeze({ latitude: -12.0970, longitude: -77.0360 }),
    'San Juan de Lurigancho':   Object.freeze({ latitude: -11.9800, longitude: -77.0000 }),
    'San Juan de Miraflores':   Object.freeze({ latitude: -12.1550, longitude: -76.9700 }),
    'San Martín de Porres':     Object.freeze({ latitude: -12.0050, longitude: -77.0800 }),
    'San Miguel':               Object.freeze({ latitude: -12.0770, longitude: -77.0900 }),
    'Santa Anita':              Object.freeze({ latitude: -12.0430, longitude: -76.9710 }),
    'Santiago de Surco':        Object.freeze({ latitude: -12.1450, longitude: -76.9900 }),
    'Surquillo':                Object.freeze({ latitude: -12.1130, longitude: -77.0200 }),
    'Ventanilla':               Object.freeze({ latitude: -11.8750, longitude: -77.1300 }),
    'Villa El Salvador':        Object.freeze({ latitude: -12.2130, longitude: -76.9360 }),
    'Villa María del Triunfo':  Object.freeze({ latitude: -12.1600, longitude: -76.9400 })
});

/**
 * Alphabetically sorted list of supported district names.
 *
 * @type {ReadonlyArray<string>}
 */
export const districtNames = Object.freeze(Object.keys(LimaDistricts).sort((a, b) => a.localeCompare(b)));
