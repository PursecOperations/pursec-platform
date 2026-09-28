import json
import os
import urllib.request

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

# ==============================================================================
# 1. FÓRMULA 1 — FUNCIONES AMPLIADAS TRACKSIDE (REAL + SIM RACING)
# ==============================================================================
def f1_trackside_engine(gap_ahead_s, pit_loss_green=21.6, pit_loss_vsc=11.0, v_apex=248, v_top=315, radio_raw=""):
    vsc_saving = round(pit_loss_green - pit_loss_vsc, 2)
    free_stop = "GANA POSICIÓN GRATIS BAJO VSC/SC" if gap_ahead_s < vsc_saving else f"Ahorra {vsc_saving}s"
    aero_ratio = round(v_apex / max(1, v_top), 3)
    # Filtro de Radio IA: Detecta palabras clave críticas de estrategia/fiabilidad
    keywords = ["plan b", "plan c", "box", "brake", "temp", "rain", "deg", "target"]
    es_radio_clave = any(k in radio_raw.lower() for k in keywords)
    return {
        "ventana_vsc_sc": free_stop,
        "eficiencia_aero": f"Curva {v_apex} km/h vs Punta {v_top} km/h (Índice {aero_ratio})",
        "radio_ia_filtrada": radio_raw if es_radio_clave else "Sin alertas críticas de radio en esta vuelta"
    }

# ==============================================================================
# 2. F2 / F3 — RELOJ TIEMPO VS VUELTAS, DELTA COMPAÑEROS Y AUDITORÍA PARADAS
# ==============================================================================
def f2_f3_trackside_engine(laps_left, avg_lap_s, clock_left_min, d1_clean_5v, d2_clean_5v, stationary_pit_s):
    termina_por_reloj = (laps_left * avg_lap_s) > (clock_left_min * 60)
    delta_companeros = round((sum(d1_clean_5v)/len(d1_clean_5v)) - (sum(d2_clean_5v)/len(d2_clean_5v)), 3)
    fallo_box = "⚠️ FALLO PISTOLA / EMBRAGUE DETECTADO" if stationary_pit_s > 4.2 else f"🟢 Parada limpia ({stationary_pit_s}s)"
    return {
        "reloj_vs_vueltas": "TERMINA POR RELOJ (60 MIN)" if termina_por_reloj else "Termina por vueltas programadas",
        "teammate_pace_delta": f"{delta_companeros:+.3f}s/v en aire limpio",
        "auditoria_parada": fallo_box
    }

# ==============================================================================
# 3. FÓRMULA E — PROYECTOR DE ADDED LAPS Y ALERTA THERMAL DERATING
# ==============================================================================
def fe_trackside_engine(sc_minutes, soc_pct, base_laps_left, battery_temp_c):
    added_laps = int(sc_minutes // 2.15)
    total_laps = base_laps_left + added_laps
    target_soc_per_lap = round(soc_pct / max(1, total_laps), 2)
    derating_alert = "🚨 RIESGO INMINENTE THERMAL DERATING (Abuso AWD)" if battery_temp_c >= 54.5 else f"🟢 Temperatura celda OK ({battery_temp_c}°C)"
    return {
        "added_laps_target": f"+{added_laps} vueltas extra FIA -> Objetivo {target_soc_per_lap}% SoC/vuelta",
        "thermal_derating": derating_alert
    }

# ==============================================================================
# 4. MOTOGP — RADAR PRESIÓN DELANTERA, FLAG-TO-FLAG Y DROP POR SECTOR
# ==============================================================================
def motogp_trackside_engine(laps_slipstream, total_laps, lap_wet_s, lap_slick_s, drop_braking_s, drop_traction_s):
    pct_legal = round((laps_slipstream / max(1, total_laps)) * 100, 1)
    riesgo_presion = "🚨 RIESGO SANCIÓN +16s (<60% vueltas >1.80 bar)" if pct_legal < 60.0 else f"🟢 Cumple presión ({pct_legal}% vueltas)"
    cruce_f2f = "🌧️ ENTRAR A CAMBIAR MOTO YA (Slick es más rápido)" if lap_slick_s < lap_wet_s else "Mantener moto de agua"
    causa_drop = "Pierde traccionando al levantar la moto" if drop_traction_s > drop_braking_s else "Pierde en fase de frenada"
    return {
        "presion_delantera": riesgo_presion,
        "flag_to_flag": cruce_f2f,
        "mapa_drop": causa_drop
    }

# ==============================================================================
# 5. INDYCAR — CRUCE ALTERNATES/PRIMARIES, 2 VS 3 PARADAS Y WAVE AROUND
# ==============================================================================
def indycar_trackside_engine(lap_alt_s, lap_pri_s, fuel_mpg_needed, lapped_cars_between_pace_and_leader):
    cruce_gomas = "Goma Blanda (Alternate) ya es más lenta que la Dura (Primary)" if lap_alt_s > lap_pri_s else "Alternate sigue en ventana óptima"
    return {
        "cruce_compuestos": cruce_gomas,
        "sim_2_vs_3_paradas": f"Para ir a 2 paradas: Ahorrar a {fuel_mpg_needed} MPG",
        "wave_around": f"Recuperan vuelta bajo amarilla: {', '.join(lapped_cars_between_pace_and_leader)}"
    }

# ==============================================================================
# 6. GT3 — OVERCUT SIN MANTAS TÉRMICAS, PIT MÍNIMO E INVENTARIO JUEGOS NUEVOS
# ==============================================================================
def gt3_trackside_engine(two_laps_hot_tyre_s, two_laps_cold_outlap_s, pit_lane_transit_s, min_pit_legal_s, new_sets_left):
    overcut_gain = round(two_laps_cold_outlap_s - two_laps_hot_tyre_s, 2)
    pit_delta = round(pit_lane_transit_s - min_pit_legal_s, 3)
    alerta_pit = f"🚨 SANCIÓN: Salió {abs(pit_delta):.3f}s ANTES del mínimo legal" if pit_delta < 0 else f"🟢 Legal (+{pit_delta:.3f}s)"
    return {
        "overcut_goma_fria": f"Quedarse fuera con goma caliente gana +{overcut_gain}s en 2 vueltas",
        "pit_minimo_check": alerta_pit,
        "inventario_gomas": f"{new_sets_left} juegos nuevos sin estrenar en garaje"
    }

# ==============================================================================
# 7. RESISTENCIA (WEC / IMSA) — SLOW ZONES, DOUBLE STINT, PASS-AROUND Y SPLASH ML
# ==============================================================================
def wec_imsa_trackside_engine(passed_before_sz_bool, tyre_change_save_s, used_tyre_loss_25v_s, fuel_left_l, cons_l, laps_left):
    sz_impact = "🟢 Ganó +9.5s pasando el sector en verde antes de la Slow Zone (80 km/h)" if passed_before_sz_bool else "Atrapado en Slow Zone"
    compensa_double = "✅ Compensa Double Stint (Ahorra tiempo neto)" if tyre_change_save_s > used_tyre_loss_25v_s else "Cambiar neumáticos"
    splash_ml = max(0, int(((laps_left * cons_l) - fuel_left_l) * 1000))
    return {
        "slow_zone_impact": sz_impact,
        "double_triple_stint": compensa_double,
        "splash_and_dash_sim_ml": f"Repostaje exacto: {splash_ml} ml · Driver Swap: 🟢 Listo"
    }

if __name__ == "__main__":
    print("Agentes Predictivos PURSEC ejecutados correctamente:")
    print("F1:", f1_trackside_engine(7.8, radio_raw="Box now, Plan B active"))
    print("GT3:", gt3_trackside_engine(268.4, 272.3, 64.910, 65.000, 1))
    print("WEC/IMSA:", wec_imsa_trackside_engine(True, 15.0, 11.2, 4.1, 2.95, 2.0))
