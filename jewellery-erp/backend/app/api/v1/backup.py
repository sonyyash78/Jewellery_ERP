from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
import os
import subprocess
from datetime import datetime
from app.core.config import settings

router = APIRouter()

@router.get("/download")
def download_backup():
    backup_dir = os.path.join(os.path.dirname(__file__), "..", "..", "backups")
    os.makedirs(backup_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"jewellery_erp_backup_{timestamp}.sql"
    backup_path = os.path.join(backup_dir, backup_filename)
    
    # Parse DATABASE_URL: mysql+pymysql://root:password@localhost:3306/jewellery_erp
    db_url = settings.DATABASE_URL
    if not db_url.startswith("mysql"):
        raise HTTPException(status_code=500, detail="Only MySQL is supported for backup")
        
    try:
        # Extract credentials
        auth_part = db_url.split("://")[1].split("@")[0]
        host_part = db_url.split("@")[1].split("/")[0]
        db_name = db_url.split("/")[-1].split("?")[0]
        
        user = auth_part.split(":")[0]
        password = auth_part.split(":")[1] if ":" in auth_part else ""
        
        # Decode password if URL encoded (e.g., %40 -> @)
        import urllib.parse
        password = urllib.parse.unquote(password)
        
        host = host_part.split(":")[0]
        
        # Standard mysqldump path on Windows or use from PATH
        mysqldump_path = r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"
        if not os.path.exists(mysqldump_path):
            mysqldump_path = "mysqldump" # fallback to PATH
            
        cmd = [
            mysqldump_path,
            f"--user={user}",
            f"--password={password}",
            f"--host={host}",
            db_name
        ]
        
        with open(backup_path, "w", encoding="utf-8") as f:
            subprocess.run(cmd, stdout=f, check=True)
            
    except Exception as e:
        print(f"Backup failed: {e}")
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")
    
    return FileResponse(
        path=backup_path, 
        filename=backup_filename, 
        media_type='application/sql'
    )

@router.get("/excel-download")
def download_excel_backup():
    import pandas as pd
    import zipfile
    from sqlalchemy import inspect
    from app.db.database import engine
    
    backup_dir = os.path.join(os.path.dirname(__file__), "..", "..", "backups")
    os.makedirs(backup_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    excel_filename = f"jewellery_erp_data_{timestamp}.xlsx"
    zip_filename = f"jewellery_erp_backup_{timestamp}.zip"
    
    excel_path = os.path.join(backup_dir, excel_filename)
    zip_path = os.path.join(backup_dir, zip_filename)
    
    try:
        # Get all table names
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if not tables:
            raise HTTPException(status_code=404, detail="No tables found in database")
            
        # Zip multiple Excel files
        excel_paths = []
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for table in tables:
                df = pd.read_sql_table(table, engine)
                table_excel_filename = f"{table}.xlsx"
                table_excel_path = os.path.join(backup_dir, table_excel_filename)
                
                # Write individual table to its own excel file
                df.to_excel(table_excel_path, index=False)
                excel_paths.append(table_excel_path)
                
                # Add it to zip
                zipf.write(table_excel_path, arcname=table_excel_filename)
                
        # Clean up the individual excel files
        for path in excel_paths:
            if os.path.exists(path):
                os.remove(path)
            
    except Exception as e:
        print(f"Excel Backup failed: {e}")
        raise HTTPException(status_code=500, detail=f"Excel Backup failed: {str(e)}")
    
    return FileResponse(
        path=zip_path, 
        filename=zip_filename, 
        media_type='application/zip'
    )

