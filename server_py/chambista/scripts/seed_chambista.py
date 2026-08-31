from server_py.chambista.models import Professional, Base
from server_py.chambista.database import SessionLocal, engine
import random
import os
import sys

# Agrega la ruta de server_py al sys.path para poder importar los módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


CATEGORIAS = [
    "Plomería", "Electricidad", "Gasfitería", "Albañilería", "Pintura",
    "Carpintería", "Cerrajería", "Soldadura", "Jardinería", "Limpieza",
    "Aire acondicionado", "Refrigeración", "Instalación de cámaras",
    "Instalación de internet", "Computadoras", "Laptops", "Celulares",
    "Electrodomésticos", "Impresoras", "Muebles", "Drywall"
]

NOMBRES = ["Carlos", "Luis", "Juan", "Maria", "Ana", "Jose", "Miguel", "Rosa", "Pedro", "Elena"]
APELLIDOS = ["Medina", "Torres", "Perez", "Gomez", "Lopez", "Garcia", "Silva", "Vargas", "Rojas", "Flores"]


def create_dummy_data():
    # Crear las tablas si no existen
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # Verificar si ya hay datos
    if db.query(Professional).count() > 0:
        print("Los datos ya han sido insertados anteriormente.")
        db.close()
        return

    print("Insertando 50 profesionales de prueba...")
    for i in range(50):
        nombre = random.choice(NOMBRES)
        apellido = random.choice(APELLIDOS)
        categoria = random.choice(CATEGORIAS)
        especialidad = f"Especialista en {categoria}"
        descripcion = f"Soy {nombre} {apellido}, con mucha experiencia en {categoria}."
        experiencia = random.randint(1, 20)
        precio = random.uniform(20.0, 150.0)
        rating = random.uniform(3.5, 5.0)

        prof = Professional(
            nombre=nombre,
            apellido=f"{apellido} {i}",  # Para que no se repitan
            categoria=categoria,
            especialidad=especialidad,
            descripcion=descripcion,
            experiencia_anios=experiencia,
            precio_base=round(precio, 2),
            rating=round(rating, 1),
            cantidad_servicios=random.randint(5, 100),
            telefono=f"9{random.randint(10000000, 99999999)}",
            correo=f"{nombre.lower()}.{apellido.lower()}{i}@example.com",
            direccion=f"Av. Principal {random.randint(100, 999)}",
            distrito="Miraflores",
            ciudad="Lima",
            latitud=-12.12 + random.uniform(-0.05, 0.05),
            longitud=-77.03 + random.uniform(-0.05, 0.05),
            disponible=True,
            activo=True
        )
        db.add(prof)

    db.commit()
    print("Datos insertados correctamente.")
    db.close()


if __name__ == "__main__":
    create_dummy_data()
