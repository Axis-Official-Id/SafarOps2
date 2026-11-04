(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SafarAuth=api;})(typeof globalThis!=='undefined'?globalThis:this, function(){
    const isAdmin=(user,license)=>Boolean(user?.id && license?.role==='superadmin' && license?.status==='active');
    async function accountRequest(client,body){
        const {data,error}=await client.functions.invoke('safarops-accounts',{body});
        if(error){
            let message='Permintaan akun gagal. Silakan coba lagi.';
            try{message=(await error.context.json()).error||message;}catch{}
            throw new Error(message);
        }
        if(data?.error)throw new Error(data.error);
        return data;
    }
    async function licenseFor(client,email,adminEmail){
        const {data,error}=await client.from('safarops_licenses').select('*').eq('email',email).maybeSingle();
        if(error) throw new Error('Data akses belum tersedia. Hubungi pemilik sistem untuk menyiapkan data akun.');
        if(data && ['blocked','frozen'].includes(data.status)) throw new Error('Akses akun diblokir atau dibekukan. Hubungi administrator.');
        if(!data) throw new Error('Email belum diberi akses. Hubungi administrator untuk pendaftaran akun.');
        return data;
    }
    async function authorize(client,user,adminEmail){
        if(!user?.id || !user.email)throw new Error('Sesi tidak valid. Silakan masuk kembali.');
        if(user.app_metadata?.password_change_required)return {passwordChangeRequired:true};
        return licenseFor(client,user.email.toLowerCase(),adminEmail);
    }
    async function submit(client,input,adminEmail){
        if(!client)throw new Error('Layanan masuk belum tersedia. Hubungi pemilik sistem.');
        const {email,password,confirmation,register}=input;
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Format alamat email tidak valid.');
        if(typeof password!=='string'||password.length<6)throw new Error('Kata sandi minimal 6 karakter.');
        if(register && password!==confirmation)throw new Error('Konfirmasi kata sandi harus sama.');
        if(register){
            if(password.length<12)throw new Error('Kata sandi baru minimal 12 karakter.');
            if(!input.token)throw new Error('Gunakan tautan aktivasi pribadi dari administrator.');
            await accountRequest(client,{action:'activate',email,password,token:input.token});
        }
        {
            const {data,error}=await client.auth.signInWithPassword({email,password});
            if(error)throw new Error(error.code==='email_not_confirmed'?'Konfirmasikan email Anda sebelum masuk.':'Email atau kata sandi tidak sesuai. Gunakan aktivasi jika belum membuat kata sandi.');
            if(!data?.session)throw new Error('Sesi masuk belum tersedia. Silakan coba lagi.');
        }
        // A returned signup user alone is not a signed-in session.
        try{
            const {data,error}=await client.auth.getUser();
            if(error||!data?.user)throw new Error('Sesi belum dapat diverifikasi. Silakan masuk kembali.');
            const license=await authorize(client,data.user,adminEmail);
            if(license?.passwordChangeRequired)return {user:data.user,passwordChangeRequired:true};
            return {user:data.user,license};
        }catch(error){await client.auth.signOut();throw error;}
    }
    return {submit,authorize,isAdmin,accountRequest};
});
