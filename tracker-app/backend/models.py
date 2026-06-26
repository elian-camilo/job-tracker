from enum import Enum
from pydantic import BaseModel, ConfigDict


class Estado(str, Enum):
    aplicado = "aplicado"
    dm_enviado = "dm_enviado"
    en_contacto = "en_contacto"
    entrevista = "entrevista"
    prueba_tecnica = "prueba_tecnica"
    oferta = "oferta"
    rechazado = "rechazado"
    sin_respuesta = "sin_respuesta"


class Plataforma(str, Enum):
    torre = "Torre"
    get_on_board = "GetOnBoard"
    manfred = "Manfred"
    linkedin = "LinkedIn"
    otro = "Otro"


class ApplicationIn(BaseModel):
    empresa: str
    rol: str
    fecha: str  # ISO YYYY-MM-DD
    estado: Estado
    plataforma: Plataforma | None = None
    contacto: str | None = None
    proximo_paso: str | None = None
    notas: str | None = None
    cv_file: str | None = None
    link: str | None = None
    salario_promedio: str | None = None
    favorito: bool = False



class ApplicationOut(ApplicationIn):
    id: str
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)


class WishlistItemIn(BaseModel):
    nombre: str
    link: str | None = None
    notas: str | None = None


class WishlistItemOut(WishlistItemIn):
    id: str
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)


class StatsOut(BaseModel):
    total: int
    response_rate: float  # 0–100, one decimal
    active_interviews: int
    offers: int
    need_followup: list[str]
