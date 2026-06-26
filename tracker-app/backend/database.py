import aiosqlite
from pathlib import Path

from models import ApplicationIn, WishlistItemIn

DB_PATH = Path(__file__).parent / "tracker.db"


async def init_db() -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        # Create applications table
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS applications (
                id               TEXT PRIMARY KEY,
                empresa          TEXT NOT NULL,
                rol              TEXT NOT NULL,
                plataforma       TEXT,
                fecha            DATE NOT NULL,
                contacto         TEXT,
                estado           TEXT NOT NULL,
                proximo_paso     TEXT,
                notas            TEXT,
                cv_file          TEXT,
                link             TEXT,
                salario_promedio TEXT,
                created_at       DATETIME DEFAULT (datetime('now')),
                updated_at       DATETIME DEFAULT (datetime('now'))
            )
            """
        )
        
        # Create wishlist table
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS wishlist (
                id          TEXT PRIMARY KEY,
                nombre      TEXT NOT NULL,
                link        TEXT,
                notas       TEXT,
                created_at  DATETIME DEFAULT (datetime('now')),
                updated_at  DATETIME DEFAULT (datetime('now'))
            )
            """
        )
        
        # Check if columns exist in applications (migration)
        async with db.execute("PRAGMA table_info(applications)") as cursor:
            columns = await cursor.fetchall()
            col_names = [col[1] for col in columns]
            if "cv_file" not in col_names:
                await db.execute("ALTER TABLE applications ADD COLUMN cv_file TEXT")
            if "link" not in col_names:
                await db.execute("ALTER TABLE applications ADD COLUMN link TEXT")
            if "salario_promedio" not in col_names:
                await db.execute("ALTER TABLE applications ADD COLUMN salario_promedio TEXT")
        
        await db.commit()


async def get_all_applications() -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM applications ORDER BY fecha DESC"
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]


async def get_application(id: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM applications WHERE id = ?", (id,)
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None


async def create_application(data: ApplicationIn, app_id: str) -> dict:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        await db.execute(
            """
            INSERT INTO applications
                (id, empresa, rol, plataforma, fecha, contacto,
                 estado, proximo_paso, notas, cv_file, link, salario_promedio, created_at, updated_at)
            VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            """,
            (
                app_id,
                data.empresa,
                data.rol,
                data.plataforma.value if data.plataforma else None,
                data.fecha,
                data.contacto,
                data.estado.value,
                data.proximo_paso,
                data.notas,
                data.cv_file,
                data.link,
                data.salario_promedio,
            ),
        )
        await db.commit()
        # Re-SELECT to return canonical timestamps
        async with db.execute(
            "SELECT * FROM applications WHERE id = ?", (app_id,)
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row)


async def update_application(id: str, data: ApplicationIn) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        await db.execute(
            """
            UPDATE applications
            SET empresa          = ?,
                rol              = ?,
                plataforma       = ?,
                fecha            = ?,
                contacto         = ?,
                estado           = ?,
                proximo_paso     = ?,
                notas            = ?,
                cv_file          = ?,
                link             = ?,
                salario_promedio = ?,
                updated_at       = datetime('now')
            WHERE id = ?
            """,
            (
                data.empresa,
                data.rol,
                data.plataforma.value if data.plataforma else None,
                data.fecha,
                data.contacto,
                data.estado.value,
                data.proximo_paso,
                data.notas,
                data.cv_file,
                data.link,
                data.salario_promedio,
                id,
            ),
        )
        await db.commit()
        # Re-SELECT to return updated row with canonical timestamps
        async with db.execute(
            "SELECT * FROM applications WHERE id = ?", (id,)
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None


async def delete_application(id: str) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "DELETE FROM applications WHERE id = ?", (id,)
        )
        await db.commit()
        return cursor.rowcount > 0


async def get_stats() -> dict:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        # Single-pass aggregate
        async with db.execute(
            """
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN estado NOT IN ('aplicado', 'dm_enviado', 'sin_respuesta')
                         THEN 1 ELSE 0 END) AS responded,
                SUM(CASE WHEN estado IN ('entrevista', 'prueba_tecnica')
                         THEN 1 ELSE 0 END) AS active_interviews,
                SUM(CASE WHEN estado = 'oferta' THEN 1 ELSE 0 END) AS offers
            FROM applications
            """
        ) as cursor:
            row = await cursor.fetchone()
            total = row["total"] or 0
            responded = row["responded"] or 0
            active_interviews = row["active_interviews"] or 0
            offers = row["offers"] or 0

        response_rate = round(responded / total * 100, 1) if total > 0 else 0.0

        # Follow-up: aplicado/dm_enviado with fecha >= 7 days ago
        async with db.execute(
            """
            SELECT id FROM applications
            WHERE estado IN ('aplicado', 'dm_enviado')
              AND fecha <= date('now', '-7 days')
            """
        ) as cursor:
            follow_rows = await cursor.fetchall()
            need_followup = [r["id"] for r in follow_rows]

    return {
        "total": total,
        "response_rate": response_rate,
        "active_interviews": active_interviews,
        "offers": offers,
        "need_followup": need_followup,
    }


async def get_all_wishlist() -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM wishlist ORDER BY created_at DESC"
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]


async def get_wishlist_item(id: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM wishlist WHERE id = ?", (id,)
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None


async def create_wishlist_item(data: WishlistItemIn, item_id: str) -> dict:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        await db.execute(
            """
            INSERT INTO wishlist
                (id, nombre, link, notas, created_at, updated_at)
            VALUES
                (?, ?, ?, ?, datetime('now'), datetime('now'))
            """,
            (
                item_id,
                data.nombre,
                data.link,
                data.notas,
            ),
        )
        await db.commit()
        # Re-SELECT to return canonical timestamps
        async with db.execute(
            "SELECT * FROM wishlist WHERE id = ?", (item_id,)
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row)


async def update_wishlist_item(id: str, data: WishlistItemIn) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        await db.execute(
            """
            UPDATE wishlist
            SET nombre     = ?,
                link       = ?,
                notas      = ?,
                updated_at = datetime('now')
            WHERE id = ?
            """,
            (
                data.nombre,
                data.link,
                data.notas,
                id,
            ),
        )
        await db.commit()
        # Re-SELECT to return updated row with canonical timestamps
        async with db.execute(
            "SELECT * FROM wishlist WHERE id = ?", (id,)
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None


async def delete_wishlist_item(id: str) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "DELETE FROM wishlist WHERE id = ?", (id,)
        )
        await db.commit()
        return cursor.rowcount > 0
