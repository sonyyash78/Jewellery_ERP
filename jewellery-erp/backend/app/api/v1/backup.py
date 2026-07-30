from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
import os
import shutil
from datetime import datetime

router = APIRouter()

@router.get("/download")
def download_backup():
    # Paths
    db_path = os.path.join(os.path.dirname(__file__), "..", "..", "jewellery_erp.db")
    backup_dir = os.path.join(os.path.dirname(__file__), "..", "..", "backups")
    os.makedirs(backup_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"jewellery_erp_backup_{timestamp}.sqlite"
    backup_path = os.path.join(backup_dir, backup_filename)
    
    # Copy DB
    shutil.copy2(db_path, backup_path)
    
    return FileResponse(
        path=backup_path, 
        filename=backup_filename, 
        media_type='application/octet-stream'
    )
