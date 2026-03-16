const mongoose=require('mongoose');
const {Schema}=mongoose;

const userSchema= new Schema({
    firstName:{
        type:String,
        required:true,
        minlength:3,
        maxlength:20
    },
    lastName:{
        type:String,
        required:true,
        minlength:3,
        maxlength:20
    },
    emailId:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        immutable:true
    },
    age:{
        type:Number,
        min:6,
        max:80
    },
    role:{
        type:String,
        enum:['user','admin'],
        default:'user',
    },
    problemSolved:{
        type:[{
            type:Schema.Types.ObjectId,
            ref:'problem'
        }],
        default:[]
    },
    password:{
        type:String,
        required:true,
        minlength: 10
    }

},{
    timestamps:true
})

userSchema.post('findOneAndDelete', async function (userInfo) {
    if(userInfo){
        await mongoose.model('submission').deleteMany({userId:doc_id});
    }
} );

const User=mongoose.model('user',userSchema);

module.exports=User;