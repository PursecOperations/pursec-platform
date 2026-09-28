import asyncio
import subprocess
import edge_tts

VOICE = "es-ES-AlvaroNeural"

GUION_DIARIO = (
    "¿Sabías que en una carrera de GT3 sin mantas térmicas parar una vuelta antes que tu rival "
    "puede hacerte perder casi cuatro segundos enteros? Cuando sales del box con neumáticos a treinta grados "
    "de temperatura, la presión interna está por los suelos y pierdes hasta dos segundos por vuelta en el primer "
    "y segundo sector mientras el coche de delante sigue tirando con goma caliente a ochenta y cinco grados. "
    "Por eso en PURSEC punto com hemos entrenado un simulador en vivo que calcula exactamente el punto de cruce "
    "del Overcut en GT3, la ventana de parada gratis bajo Virtual Safety Car en Fórmula 1, el radar de presión "
    "mínima delantera en MotoGP y hasta el cálculo de gasolina al mililitro para tus carreras de resistencia "
    "en Sim Racing. Entra gratis ahora mismo en el enlace de nuestro perfil y prueba el nuevo Live Timing predictivo."
)

async def sintetizar_voz(texto, audio_out, srt_out):
    communicate = edge_tts.Communicate(texto, VOICE, rate="+8%")
    submaker = edge_tts.SubMaker()
    with open(audio_out, "wb") as f:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                submaker.create_sub((chunk["offset"], chunk["duration"]), chunk["text"])
    with open(srt_out, "w", encoding="utf-8") as f:
        f.write(submaker.generate_subs())

def renderizar_short():
    audio_path = "voz_marketing.mp3"
    srt_path = "subs_marketing.srt"
    asyncio.run(sintetizar_voz(GUION_DIARIO, audio_path, srt_path))

    if not subprocess.os.path.exists("fondo_pitwall.mp4"):
        print("Audio y subtítulos generados. Sube fondo_pitwall.mp4 para renderizar el MP4 completo.")
        return

    cmd_dur = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", audio_path]
    dur = float(subprocess.check_output(cmd_dur).decode("utf-8").strip())

    estilo = "Fontname=Impact,Fontsize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&H00EA3393,BorderStyle=1,Outline=2,Alignment=10"
    subprocess.run([
        "ffmpeg", "-y", "-t", str(dur), "-i", "fondo_pitwall.mp4", "-i", audio_path,
        "-vf", f"subtitles={srt_path}:force_style='{estilo}'",
        "-map", "0:v:0", "-map", "1:a:0", "-c:v", "libx264", "-preset", "fast", "-c:a", "aac", "pursec_daily_short.mp4"
    ], check=True)

if __name__ == "__main__":
    renderizar_short()
