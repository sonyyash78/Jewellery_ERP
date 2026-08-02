import pymysql

conn = pymysql.connect(host='localhost', user='root', password='root1234@', database='jewellery_erp')
cursor = conn.cursor()
cursor.execute("ALTER TABLE invoices MODIFY status ENUM('Draft', 'Partial', 'Paid', 'Completed', 'Cancelled') DEFAULT 'Draft';")
conn.commit()
print('Success!')
