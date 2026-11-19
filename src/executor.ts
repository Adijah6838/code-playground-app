import vm from 'vm';

export const executeCode = (code: string) => {
  const logs: string[] = [];
  
  const customConsole = {
    log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
    error: (...args: any[]) => logs.push('Error: ' + args.join(' ')),
    warn: (...args: any[]) => logs.push('Warn: ' + args.join(' ')),
  };

  const sandbox = {
    console: customConsole,
    Math: Math,
    Date: Date,
    JSON: JSON,
    setTimeout: undefined,
    setInterval: undefined,
    clearTimeout: undefined,
    clearInterval: undefined,
  };

  try {
    const result = vm.runInNewContext(code, sandbox, { timeout: 2000 });
    return { 
      success: true, 
      logs, 
      result: result !== undefined ? String(result) : undefined 
    };
  } catch (error: any) {
    return { 
      success: false, 
      logs, 
      error: error.message 
    };
  }
};