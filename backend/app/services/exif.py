from datetime import datetime
from typing import Optional

from PIL import ExifTags, Image
from PIL.ExifTags import GPSTAGS


def _to_degrees(value) -> float:
    d, m, s = value
    return float(d) + float(m) / 60.0 + float(s) / 3600.0


def extract_photo_metadata(file_bytes: bytes) -> dict:
    """Returns {taken_at, lat, lon} pulled from EXIF. Any missing field is None."""
    result: dict = {"taken_at": None, "lat": None, "lon": None}

    with Image.open(file_bytes if hasattr(file_bytes, "read") else __import__("io").BytesIO(file_bytes)) as img:
        exif_raw = img.getexif()
        if not exif_raw:
            return result

        tags = {ExifTags.TAGS.get(k, k): v for k, v in exif_raw.items()}

        taken_str = tags.get("DateTimeOriginal") or tags.get("DateTime")
        if taken_str:
            try:
                result["taken_at"] = datetime.strptime(taken_str, "%Y:%m:%d %H:%M:%S")
            except ValueError:
                pass

        gps_info = exif_raw.get_ifd(0x8825) if hasattr(exif_raw, "get_ifd") else None
        if gps_info:
            gps = {GPSTAGS.get(k, k): v for k, v in gps_info.items()}
            lat = gps.get("GPSLatitude")
            lat_ref = gps.get("GPSLatitudeRef")
            lon = gps.get("GPSLongitude")
            lon_ref = gps.get("GPSLongitudeRef")
            if lat and lon:
                lat_deg = _to_degrees(lat)
                lon_deg = _to_degrees(lon)
                if lat_ref == "S":
                    lat_deg = -lat_deg
                if lon_ref == "W":
                    lon_deg = -lon_deg
                result["lat"] = lat_deg
                result["lon"] = lon_deg

    return result
