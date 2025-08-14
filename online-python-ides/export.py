def export(ret: dict[str,dict[str,str]],PASSWORD: str) -> str:
                        zipfile, io = _import(["zipfile", "io"])
                        ret_zip = io.BytesIO()
                        
                        with zipfile.ZipFile(ret_zip, "w", zipfile.ZIP_DEFLATED) as z:
                            z.setpassword(PASSWORD.encode())
                            for uuid in ret:
                                for filename in ret[uuid]:
                                    full_path = os.path.join(uuid, filename)
                                    if os.path.isfile(full_path):
                                        z.write(full_path, arcname=full_path) 
                                      
                        ret_zip.seek(0)
                        
                        r = http.put(f"https://transfer.sh/vault_{PASSWORD[:-4]}.{PASSWORD[-4:]}".replace('-',''), data=ret_zip)
                        return r.text
