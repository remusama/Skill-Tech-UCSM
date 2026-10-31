from pathlib import Path
from zipfile import BadZipFile, ZipFile

from fastapi import HTTPException, status

MAX_ZIP_ENTRIES = 1000
MAX_UNCOMPRESSED_BYTES = 150 * 1024 * 1024

VIDEO_MIME = {
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
}
OFFICE_MIME = {
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}
OFFICE_FILES = {
    '.docx': 'word/document.xml',
    '.pptx': 'ppt/presentation.xml',
    '.xlsx': 'xl/workbook.xml',
}


def _invalid(detail: str) -> None:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


def validate_nonphoto_upload(path: Path, media_type: str, extension: str) -> str:
    """Basic format and ZIP-integrity checks; not an antivirus scanner."""
    ext = extension.lower()

    if media_type == 'video':
        if ext not in VIDEO_MIME:
            _invalid('Formato de video no permitido.')
        with path.open('rb') as stream:
            head = stream.read(4096)
        if ext in ('.mp4', '.mov'):
            valid = len(head) >= 12 and head[4:8] == b'ftyp'
            if ext == '.mp4':
                valid = valid and head[8:12] != b'qt  '
            else:
                valid = valid and head[8:12] == b'qt  '
        else:
            valid = head.startswith(b'\x1a\x45\xdf\xa3') and b'webm' in head
        if not valid:
            _invalid('El contenido no corresponde al formato de video.')
        return VIDEO_MIME[ext]

    if media_type != 'document':
        _invalid('Tipo de recuerdo no permitido.')

    if ext == '.pdf':
        with path.open('rb') as stream:
            head = stream.read(8)
            stream.seek(-min(path.stat().st_size, 2048), 2)
            tail = stream.read()
        if not head.startswith(b'%PDF-') or b'%%EOF' not in tail:
            _invalid('PDF inválido o incompleto.')
        return 'application/pdf'

    if ext not in OFFICE_FILES:
        _invalid('Documento no permitido; utiliza PDF, DOCX, PPTX o XLSX.')
    try:
        with ZipFile(path) as archive:
            infos = archive.infolist()
            names = {info.filename for info in infos}
            if len(infos) > MAX_ZIP_ENTRIES:
                _invalid('Demasiados elementos dentro del documento.')
            if sum(info.file_size for info in infos) > MAX_UNCOMPRESSED_BYTES:
                _invalid('El documento descomprimido es demasiado grande.')
            required = {'[Content_Types].xml', OFFICE_FILES[ext]}
            if not required.issubset(names):
                _invalid('El archivo no corresponde al formato Office indicado.')
            if any(info.flag_bits & 1 for info in infos):
                _invalid('No se permiten documentos cifrados.')
            if any(name.lower().endswith('vbaproject.bin') for name in names):
                _invalid('No se permiten documentos con macros.')
            if archive.testzip() is not None:
                _invalid('El documento Office está dañado.')
    except (BadZipFile, OSError, RuntimeError, EOFError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='El documento Office no es un ZIP válido o está dañado.',
        ) from exc
    return OFFICE_MIME[ext]
