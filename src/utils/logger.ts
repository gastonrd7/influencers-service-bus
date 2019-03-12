import * as winston from 'winston';
import * as path from 'path';
import 'dotenv/config';

export default class Logger{

    private static _instance : Logger = new Logger();



    private _logger; 

    constructor() {
        if(Logger._instance){
            throw new Error("Error: Instantiation failed: Use Logger.getInstance() instead of new.");
        }
        winston.addColors({
            error: 'red',
            debug: 'blue',
            warn: 'yellow',
            data: 'grey',
            info: 'green',
            verbose: 'cyan',
            silly: 'magenta',
            custom: 'yellow'
          });
        Logger._instance = this;

        let transports = [];
        if (process.env.LOG_IN_FILE == 'TRUE') transports.push(new winston.transports.File({ filename : path.join(__dirname, '../../../log/api-insight-logfile.log'), handleExceptions: true }));
        if (process.env.LOG_IN_CONSOLE == 'TRUE') transports.push(new winston.transports.Console({format: winston.format.colorize()}));
        Logger._instance._logger = winston.createLogger({
            levels: {
                error: 0,
                debug: 1,
                warn: 2,
                data: 3,
                info: 4,
                verbose: 5,
                silly: 6,
                custom: 7
              },
            format: winston.format.combine(
                winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
              }),
              //winston.format.colorize(),
              //
              // The simple format outputs
              // `${level}: ${message} ${[Object with everything else]}`
              //
              // format.simple()
              //
              // Alternatively you could use this custom printf format if you
              // want to control where the timestamp comes in your final message.
              // Try replacing `format.simple()` above with this:
              //
                winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
            ),
            transports: transports,
             exceptionHandlers: [
               new winston.transports.File({ filename: path.join(__dirname, '../../../log/api-insight-logfile.log') })
             ],
            level: 'custom'
        });
       

    }


    public static async log(message: string){
        await this.getInstance()._logger.log('info', message);
    }

    public static async warn(message: string){
        await this.getInstance()._logger.warn(message);
    }

    public static async error(message, error?: any){
        await this.getInstance()._logger.error(message);
        if (error != null ) await this.getInstance()._logger.error(error);
    }

    public static async debug(message: string){
        await this.getInstance()._logger.debug( message );
    }


    //#region Private

    private static getInstance():Logger
    {
        return Logger._instance;
    }

    //#endregion Private



}