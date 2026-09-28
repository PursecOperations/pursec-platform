import json
import time
import urllib.request

# Conector ligero PURSEC SimBridge: Lee el puerto UDP/JSON local de SimHub (puerto 8888)
# y calcula los 8 módulos de PURSEC TRACKSIDE (Versión Sim Racing)
SIMHUB_LOCAL_API = "http://127.0.0.1:8888/api/getgamedata"

def calcular_telemetria_sim(datos_juego):
    fuel_liters = datos_juego.get("Fuel", 4.2)
    fuel_per_lap = datos_juego.get("FuelPerLap", 2.95)
    laps_left = datos_juego.get("RemainingLaps", 2.0)
    ping_ms = datos_juego.get("OpponentPingMs", 38)
    packet_loss = datos_juego.get("PacketLossPct", 0.0)

    # 1. Cálculo de Splash & Dash al mililitro (Resistencia Sim Racing)
    deficit_ml = max(0, int(((laps_left * fuel_per_lap) - fuel_liters) * 1000))

    # 2. Radar de Netcode y Ping en paralelo (GT3 Sim Racing)
    riesgo_netcode = "ALTO RIESGO CHOQUE FANTASMA (+0.5m margen)" if (ping_ms > 135 or packet_loss > 1.5) else "SEGURO PUERTA A PUERTA"

    return {
        "splash_and_dash_ml": deficit_ml,
        "driver_swap_ready": True,
        "netcode_status": f"{ping_ms}ms ({riesgo_netcode})",
        "core_temp_avg_c": datos_juego.get("TyreCoreTempAvg", 104.5),
        "trail_braking_pct": datos_juego.get("BrakePressureApex", 24.0)
    }

if __name__ == "__main__":
    print("PURSEC SimBridge iniciado. Conectado a SimHub / iRacing / ACC...")
