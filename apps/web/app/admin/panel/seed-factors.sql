INSERT INTO emission_factors (id, name, "fuelType", unit, "kgCO2", "kgCH4", "kgN2O", source, region, year, "isActive", "createdAt", "updatedAt") VALUES

-- ALCANCE 1: COMBUSTIÓN ESTACIONARIA
(gen_random_uuid(), 'Diésel — combustión estacionaria', 'Diesel', 'LITER', 2.68, 0.00014, 0.00004, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Gasolina — combustión estacionaria', 'Gasolina', 'LITER', 2.31, 0.00033, 0.00003, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'GLP / Gas licuado de petróleo', 'GLP', 'KG', 2.98, 0.00010, 0.00006, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Gas natural — combustión estacionaria', 'Gas natural', 'M3', 2.02, 0.00033, 0.00006, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Carbón bituminoso', 'Carbón', 'KG', 2.42, 0.00010, 0.00015, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Fuel oil / Petróleo residual', 'Fuel oil', 'LITER', 3.17, 0.00010, 0.00006, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Biomasa — madera', 'Biomasa', 'KG', 0.00, 0.00300, 0.00004, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),

-- ALCANCE 1: COMBUSTIÓN MÓVIL
(gen_random_uuid(), 'Diésel — vehículos terrestres', 'Diesel', 'LITER', 2.68, 0.00014, 0.00004, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Gasolina — vehículos terrestres', 'Gasolina', 'LITER', 2.31, 0.00033, 0.00003, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Jet fuel / Combustible aviación', 'Jet A-1', 'LITER', 2.55, 0.00010, 0.00010, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Diésel — vehículos pesados y camiones', 'Diesel', 'LITER', 2.68, 0.00020, 0.00006, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),

-- ALCANCE 1: REFRIGERANTES FUGITIVOS (GWP en kgCO2eq/kg)
(gen_random_uuid(), 'Refrigerante R-134a (HFC)', 'R-134a', 'KG', 1430.00, 0.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Refrigerante R-410A (HFC)', 'R-410A', 'KG', 2088.00, 0.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Refrigerante R-22 (HCFC)', 'R-22', 'KG', 1760.00, 0.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Refrigerante R-404A (HFC)', 'R-404A', 'KG', 3922.00, 0.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Hexafluoruro de azufre SF₆', 'SF6', 'KG', 23500.00, 0.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Perfluorometano CF₄ (PFC)', 'CF4', 'KG', 7390.00, 0.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),

-- ALCANCE 1: GANADERÍA
(gen_random_uuid(), 'Ganado bovino — fermentación entérica', 'CH4 entérico', 'KG', 0.00, 1.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Ganado ovino — fermentación entérica', 'CH4 entérico', 'KG', 0.00, 1.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Ganado porcino — fermentación entérica', 'CH4 entérico', 'KG', 0.00, 1.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Ganado caprino — fermentación entérica', 'CH4 entérico', 'KG', 0.00, 1.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),

-- ALCANCE 1: AGRICULTURA
(gen_random_uuid(), 'Fertilizantes sintéticos nitrogenados — N₂O', 'Fertilizante N', 'KG', 0.00, 0.00, 0.01, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Fertilizantes orgánicos — N₂O', 'Fertilizante orgánico', 'KG', 0.00, 0.00, 0.01, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),

-- ALCANCE 1: PROCESOS INDUSTRIALES
(gen_random_uuid(), 'Producción de cemento', 'Clinker', 'TON', 525.00, 0.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Producción de cal', 'Cal', 'TON', 750.00, 0.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Producción de acero', 'Acero', 'TON', 1800.00, 0.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Producción de aluminio', 'Aluminio', 'TON', 11500.00, 0.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),

-- ALCANCE 3: VIAJES AÉREOS
(gen_random_uuid(), 'Vuelo corto haul — hasta 3700 km', 'Jet A-1', 'KM_PASSENGER', 0.25500, 0.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Vuelo largo haul — más de 3700 km', 'Jet A-1', 'KM_PASSENGER', 0.19500, 0.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Vuelo corto haul con radiative forcing', 'Jet A-1', 'KM_PASSENGER', 0.51000, 0.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Vuelo largo haul con radiative forcing', 'Jet A-1', 'KM_PASSENGER', 0.39000, 0.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),

-- ALCANCE 3: TRANSPORTE DE CARGA
(gen_random_uuid(), 'Transporte carga — camión', 'Diesel', 'TON_KM', 0.11200, 0.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Transporte carga — ferrocarril', 'Diesel', 'TON_KM', 0.02800, 0.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Transporte carga — marítimo', 'Fuel oil', 'TON_KM', 0.01600, 0.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),

-- ALCANCE 3: RESIDUOS SÓLIDOS
(gen_random_uuid(), 'Residuos — relleno sanitario', 'Residuos', 'TON_WASTE', 0.00, 1.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Residuos — incineración', 'Residuos', 'TON_WASTE', 1100.00, 0.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),

-- ALCANCE 3: BIENES Y SERVICIOS
(gen_random_uuid(), 'Papel y cartón comprado', 'Papel', 'TON', 920.00, 0.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now()),
(gen_random_uuid(), 'Plástico comprado', 'Plástico', 'TON', 3500.00, 0.00, 0.00, 'IPCC_AR6', 'GLOBAL', 2023, true, now(), now());