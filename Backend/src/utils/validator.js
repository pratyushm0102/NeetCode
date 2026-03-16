const validator=require('validator');

const validate=(data)=>{

        const mandatoryFiled=['firstName','lastName','emailId','password'];
    
        const IsAllowed=mandatoryFiled.every((k)=>Object.keys(data).includes(k));
    
        if(!IsAllowed)
            throw new Error("Some filed is missing");
    
        if(!validator.isEmail(data.emailId))
            throw new Error("Invalid Email");
    
        if(!validator.isStrongPassword(data.password))
            throw new Error("Password must be at least 10 chars with uppercase, lowercase, number, and symbol");
        
        if (data.firstName.length < 3 || data.firstName.length > 20) 
            throw new Error("First Name must be between 3 and 20 characters");
    
        if (data.lastName.length < 3 || data.lastName.length > 20) 
            throw new Error("Last Name must be between 3 and 20 characters");

}



module.exports=validate;