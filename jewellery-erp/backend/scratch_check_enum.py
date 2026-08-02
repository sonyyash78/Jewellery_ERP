import pymysql

conn = pymysql.connect(host='localhost', user='root', password='root1234@', database='jewellery_erp')
cursor = conn.cursor()
cursor.execute("SHOW COLUMNS FROM invoices LIKE 'status';")
print(cursor.fetchone())
